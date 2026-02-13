/**
 * RENTAL REQUEST FORM (multi-step)
 * Step 1: ZIP code. Step 2: Choose equipment (from API models). Step 3: Start/end dates.
 * Step 4: Project details (type, company, name). Step 5: Contact (name, email, phone, comments) and Submit.
 * After submit: success step with "Go to Home" and optional "Find a location" link.
 * - Lead ID is saved in AsyncStorage so we can update the same lead as the user moves through steps.
 * - Errors are shown inline (no alert popups). Step 5 submit triggers parent to show full-screen "Submitting..." overlay.
 */
import { useAppContext } from "@/context/AppContext";
import { EQUIPTER_RENT_URL } from "@/lib/useEnv";
import axiosClient from "@/lib/utils";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { AxiosResponse } from "axios";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PhoneDialer } from "./PhoneDialer";

// --- Date helpers (used for rental start/end dates) ---
const today = new Date();
today.setHours(0, 0, 0, 0);

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toDate(d: Date | string | undefined, fallback: Date): Date {
  if (d == null) return fallback;
  const parsed = d instanceof Date ? d : new Date(d as string);
  return isNaN(parsed.getTime()) ? fallback : parsed;
}

function formatDateForDisplay(
  d: Date | string | undefined,
  fallback: string,
): string {
  if (d == null) return fallback;
  const date = toDate(d, new Date());
  if (isNaN(date.getTime())) return fallback;
  try {
    const formatted = format(date, "PPP");
    return formatted && String(formatted).trim()
      ? formatted
      : date.toLocaleDateString();
  } catch {
    return date.toLocaleDateString();
  }
}

// Project type options shown in step 4
const PROJECT_TYPES = [
  "Roofing",
  "Landscaping",
  "General Construction",
  "Restoration",
  "Home Renovation",
  "Commercial Project",
  "Other",
];

const totalSteps = 5;
export const LOCAL_LEAD_KEY = "formID"; // AsyncStorage key for current lead ID
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Open URL: on Android use Custom Tab in same task (createTask: false) so returning to the app doesn't freeze.
 * Requires app.json plugin "expo-web-browser" with experimentalLauncherActivity: true (native rebuild).
 */
function openUrl(url: string) {
  if (Platform.OS === "android") {
    WebBrowser.openBrowserAsync(url, { createTask: false });
  } else {
    WebBrowser.openBrowserAsync(url);
  }
}

/** Shape of form data; maps to API lead fields (e.g. zip__c, email__c) */
interface FormData {
  zipCode: string;
  equipment: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  status: "draft" | "submitted" | "closed";
  customerType?: "company_contractor" | "individual_homeowner";
  companyName: string;
  projectType: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  comments: string;
}

interface RentalRequestFormProps {
  onBackToHome?: () => void;
  /** Called with true when final submit (step 5) starts, false when it ends. Used to show full-screen "Submitting..." on rental page. */
  onSubmittingChange?: (submitting: boolean) => void;
}

const RentalRequestForm: React.FC<RentalRequestFormProps> = ({
  onSubmittingChange,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // --- Form state ---
  const [equipmentOptions, setEquipmentOptions] = useState<any[]>([]);
  const [formData, setFormData] = useState<FormData>({
    zipCode: "",
    status: "draft",
    equipment: "",
    startDate: undefined,
    endDate: undefined,
    customerType: undefined,
    companyName: "",
    projectType: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    comments: "",
  });
  /** Filled after step 5 submit; shown on success step (6) */
  const [locationDetails, setLocationDetails] = useState<{
    [k: string]: string | null;
  }>({
    distance: "",
    phone: "",
    name: "",
    email: "",
    zip: "",
    county: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { models, fetchModels } = useAppContext();
  const [currentStep, setCurrentStep] = useState(1);
  /** Inline errors per field (no alert popups); cleared when user edits the field or changes step */
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  /** API-level error message (e.g. "Too many requests"); shown in a banner above the form */
  const [apiError, setApiError] = useState<string | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showProjectTypePicker, setShowProjectTypePicker] = useState(false);
  /** Used only on step 5: keyboard height so we can set marginBottom and avoid gap above keyboard */
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  /** Build API payload from formData; overrides (e.g. step__c) merged in */
  const buildPayload = (
    overrides: Record<string, string | number | boolean | Date | null> = {},
  ) => {
    return {
      zip__c: formData.zipCode || null,
      help_me_choose__c:
        Boolean(formData.equipment == "not-sure" ? true : false) || null,
      project_type__c: formData.projectType || null,
      email__c: formData.email?.trim() || null,
      first_name__c: formData.firstName?.trim() || null,
      last_name__c: formData.lastName?.trim() || null,
      comments__c: formData.comments?.trim() || null,
      renter_type__c: (currentStep >= 4 && formData.customerType) || null,
      start_date__c:
        formData.startDate != null ? new Date(formData.startDate) : null,
      end_date__c: formData.endDate != null ? new Date(formData.endDate) : null,
      status__c: "draft",
      phone__c: formData.phone || null,
      company_name__c:
        formData.customerType == "individual_homeowner"
          ? null
          : formData.companyName?.trim(),
      step__c: overrides.step__c ?? null,
      selected_model__c:
        formData.equipment == "not-sure" ? null : formData.equipment,
      ...overrides,
    };
  };

  /**
   * Create a new lead (POST) or update existing (PUT) and advance to next step on success.
   * Only step 5 triggers onSubmittingChange so the rental page shows "Submitting..." full-screen.
   */
  async function createOrUpdateLead(stepNumber?: number) {
    const isFinalSubmit = currentStep === 5;
    setIsSubmitting(true);
    if (isFinalSubmit) onSubmittingChange?.(true);
    try {
      const id = await AsyncStorage.getItem(LOCAL_LEAD_KEY);
      let payload: Record<string, string | number | boolean | Date | null>;
      let url: string;
      let result: AxiosResponse;

      if (id != null && id != undefined && id !== "") {
        payload = buildPayload({ step__c: stepNumber || currentStep });
        url = `/lead/${id}`;
        result = await axiosClient.put(url, payload);
      } else {
        url = `/lead`;
        payload = buildPayload({ step__c: stepNumber || currentStep });
        result = await axiosClient.post(url, payload);
        const leadID = result.data?.data.id;
        await AsyncStorage.setItem(LOCAL_LEAD_KEY, String(leadID));
      }

      if (result.status == 200 || result.status == 201) {
        setCurrentStep((prev) => (prev += 1));
      }

      if (currentStep == 5) {
        setLocationDetails({
          distance: result.data.data.distance,
          phone: result.data.data.phone,
          name: result.data.data.locName,
          zip: result.data.data.zip,
          country: result.data.data.country,
          street: result.data.data.street,
          state: result.data.data.state,
        });
      }
    } catch (err: any) {
      setApiError(null);
      setFieldErrors((prev) => ({}));
      // Invalid ZIP: show inline error on zip field
      if (
        err?.response?.status === 400 &&
        err.response.data.message == "Invalid zip code"
      ) {
        setFieldErrors((prev) => ({
          ...prev,
          zipCode:
            "Please enter a valid ZIP code. The postal code should be valid.",
        }));
        return;
      }
      if (err?.response?.status === 429) {
        setApiError("Too many requests. Please try again in 15 minutes.");
        return;
      }
      // 404 or update failed: retry by creating a new lead and advance step
      if (
        err?.response?.status === 404 ||
        err.response.data.message == "Failed to update lead"
      ) {
        if (formData.zipCode == null) {
          setCurrentStep(1);
          return;
        }
        await AsyncStorage.removeItem(LOCAL_LEAD_KEY);
        const createUrl = `/lead`;
        const createPayload = buildPayload({
          step__c: stepNumber || currentStep,
        });
        const createResult = await axiosClient.post(createUrl, createPayload, {
          timeout: 10000,
        });
        const leadID = createResult.data?.data.id;
        await AsyncStorage.setItem(LOCAL_LEAD_KEY, String(leadID));
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
        return;
      }
      setApiError("Failed to submit. Please try again later.");
    } finally {
      setIsSubmitting(false);
      onSubmittingChange?.(false);
    }
  }

  /** Validate current step, then create/update lead and go to next step (or show success on step 5). */
  const handleNext = async () => {
    closeDatePickers();
    if (!(await validateCurrentStep())) return;
    if (currentStep === 1) {
      await createOrUpdateLead();
      return;
    }
    if (currentStep === 2) {
      await createOrUpdateLead(2);
      return;
    }
    if (currentStep === 3) {
      await createOrUpdateLead(3);
      return;
    }
    if (currentStep === 4) {
      await createOrUpdateLead(4);
      return;
    }
    if (currentStep === 5) {
      await createOrUpdateLead(5);
      return;
    }
  };

  const handlePrevious = () => {
    closeDatePickers();
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  /** Run validation for the current step; set fieldErrors and return false if invalid, else true. */
  const validateCurrentStep = async (): Promise<boolean> => {
    setApiError(null);
    switch (currentStep) {
      case 1: {
        if (!formData.zipCode || formData.zipCode?.length < 5) {
          setFieldErrors((prev) => ({
            ...prev,
            zipCode:
              "Please enter a valid ZIP code (we need your location to find nearby rentals).",
          }));
          return false;
        }
        setFieldErrors((prev) => ({ ...prev, zipCode: "" }));
        return true;
      }
      case 2: {
        if (!formData.equipment) {
          setFieldErrors((prev) => ({
            ...prev,
            equipment: "Please select the Equipter model you'd like to rent.",
          }));
          return false;
        }
        setFieldErrors((prev) => ({ ...prev, equipment: "" }));
        return true;
      }
      case 3: {
        if (!formData.startDate) {
          setFieldErrors((prev) => ({
            ...prev,
            startDate: "Please select a start date for your rental.",
          }));
          return false;
        }
        setFieldErrors((prev) => ({ ...prev, startDate: "" }));
        return true;
      }
      case 4: {
        const errs: Record<string, string> = {};
        if (!formData.firstName.trim())
          errs.firstName = "Please enter your first name.";
        if (!formData.lastName.trim())
          errs.lastName = "Please enter your last name.";
        if (
          formData.customerType === "company_contractor" &&
          !formData.companyName.trim()
        ) {
          errs.companyName = "Company name is required for business rentals.";
        }
        if (Object.keys(errs).length > 0) {
          setFieldErrors((prev) => ({ ...prev, ...errs }));
          return false;
        }
        setFieldErrors((prev) => ({
          ...prev,
          firstName: "",
          lastName: "",
          companyName: "",
        }));
        return true;
      }
      case 5: {
        const errs5: Record<string, string> = {};
        if (!formData.email) errs5.email = "Please provide your contact email.";
        else if (!emailRegex.test(formData.email))
          errs5.email = "Please enter a valid email address.";
        if (!formData.phone || formData.phone?.length < 10) {
          errs5.phone =
            formData.phone?.length && formData.phone.length < 10
              ? "Please enter a valid 10-digit phone number."
              : "Please provide your contact phone number.";
        }
        if (Object.keys(errs5).length > 0) {
          setFieldErrors((prev) => ({ ...prev, ...errs5 }));
          return false;
        }
        setFieldErrors((prev) => ({ ...prev, email: "", phone: "" }));
        return true;
      }
      default:
        return true;
    }
  };

  /** Update one form field and clear that field's error so inline message disappears on edit */
  const updateFormData = (
    field: keyof FormData,
    value: string | number | Date | undefined,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (next[field]) delete next[field];
      return next;
    });
  };

  /** Open start date: Android uses native picker; iOS shows our inline spinner (below buttons) */
  const openStartDatePicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: toDate(formData.startDate, today),
        mode: "date",
        minimumDate: today,
        maximumDate: formData.endDate
          ? addDays(toDate(formData.endDate, today), -1)
          : undefined,
        onChange: (event, selectedDate) => {
          if (event.type === "set" && selectedDate) {
            updateFormData("startDate", new Date(selectedDate.getTime()));
          }
        },
      });
    } else {
      setShowEndDatePicker(false);
      setShowStartDatePicker(true);
    }
  };

  /** Open end date; ensure only one of start/end picker is open at a time */
  const openEndDatePicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: formData.endDate
          ? toDate(formData.endDate, today)
          : addDays(toDate(formData.startDate, today), 1),
        mode: "date",
        minimumDate: toDate(formData.startDate, today),
        onChange: (event, selectedDate) => {
          if (event.type === "set" && selectedDate) {
            updateFormData("endDate", new Date(selectedDate.getTime()));
          }
        },
      });
    } else {
      setShowStartDatePicker(false);
      setShowEndDatePicker(true);
    }
  };

  /** Close both date pickers (e.g. when user taps Next/Previous) */
  const closeDatePickers = () => {
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
  };

  useEffect(() => {
    const initializeForm = async () => {
      const id = await AsyncStorage.getItem(LOCAL_LEAD_KEY);
      if (id == null || id == undefined || id == "") {
        await AsyncStorage.clear();
      }
      if (models?.length == 0) {
        await fetchModels();
      }
    };
    initializeForm();
  }, []);

  /** Build equipment list for step 2 from API models + "Not sure" option */
  useEffect(() => {
    if (models?.length > 0) {
      const newEquipmentOptions = models?.map((m) => ({
        value: m?.sfid,
        label: `Equipter ${m?.code__c}`,
        description: m?.blurb__c,
        thumbnail: m?.image_url__c,
        video: m?.video_url__c,
      }));
      setEquipmentOptions([
        ...newEquipmentOptions,
        {
          value: "not-sure",
          label: "Not Sure - Help Me Choose",
          description: "Our experts will recommend the best option",
          thumbnail: require("@/assets/images/help-choose-thumb.jpg"),
        },
      ]);
    }
  }, [models]);

  /** On success (step 6), clear stored lead ID so next rental starts fresh */
  useEffect(() => {
    if (currentStep == 6) {
      AsyncStorage.removeItem(LOCAL_LEAD_KEY);
    }
  }, [currentStep]);

  /** Clear all errors when moving to a new step */
  useEffect(() => {
    setFieldErrors((prev) => ({}));
    setApiError(null);
  }, [currentStep]);

  /** Track keyboard height for step 5: we use marginBottom so form sits just above keyboard with no gap */
  useEffect(() => {
    const subShow = Keyboard.addListener("keyboardDidShow", (e) =>
      setKeyboardHeight(e.endCoordinates.height),
    );
    const subHide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardHeight(0),
    );
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  /** Render the current step's form content (ZIP, equipment, dates, details, contact, or success). */
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <MaterialIcons name="place" size={48} color="#FF6B35" />
              <Text style={styles.stepTitle}>
                Where do you need the equipment?
              </Text>
              <Text style={styles.stepDescription}>
                Enter your ZIP code to find nearby Equipter rental locations
              </Text>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>ZIP Code *</Text>
              <TextInput
                style={[styles.input, fieldErrors.zipCode && styles.inputError]}
                placeholder="Enter your ZIP code"
                value={formData.zipCode}
                onChangeText={(text) => {
                  const digits = text.replace(/\D/g, "").slice(0, 10);
                  updateFormData("zipCode", digits);
                }}
                keyboardType="number-pad"
                maxLength={10}
              />
              {fieldErrors.zipCode ? (
                <Text style={styles.errorText}>{fieldErrors.zipCode}</Text>
              ) : null}
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <MaterialIcons name="build" size={48} color="#FF6B35" />
              <Text style={styles.stepTitle}>
                What Equipter equipment do you need?
              </Text>
              <Text style={styles.stepDescription}>
                Select the model that best fits your project requirements
              </Text>
            </View>
            <View
              style={[
                styles.equipmentList,
                fieldErrors.equipment && styles.equipmentListError,
              ]}
            >
              {equipmentOptions.map((option) => (
                <View
                  key={option.value}
                  style={[
                    styles.equipmentCard,
                    formData.equipment === option.value &&
                      styles.equipmentCardSelected,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.equipmentCardTouchable}
                    onPress={() => updateFormData("equipment", option.value)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={
                        typeof option.thumbnail === "string"
                          ? { uri: option.thumbnail }
                          : option.thumbnail
                      }
                      style={styles.equipmentThumbnail}
                    />
                    <View style={styles.equipmentInfo}>
                      <Text style={styles.equipmentLabel}>{option.label}</Text>
                      <Text style={styles.equipmentDescription}>
                        {option.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  {option.video ? (
                    <TouchableOpacity
                      style={styles.watchVideoButton}
                      onPress={() => openUrl(option.video)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="play-circle" size={20} color="#fff" />
                      <Text style={styles.watchVideoButtonText}>
                        Watch Video
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </View>
            {fieldErrors.equipment ? (
              <Text style={styles.errorText}>{fieldErrors.equipment}</Text>
            ) : null}
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <MaterialIcons name="calendar-today" size={48} color="#FF6B35" />
              <Text style={styles.stepTitle}>When do you need it?</Text>
              <Text style={styles.stepDescription}>
                Select your preferred rental dates
              </Text>
            </View>
            <View style={styles.dateContainer}>
              <View style={styles.dateInputContainer}>
                <Text style={styles.label}>Start Date *</Text>
                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    fieldErrors.startDate && styles.dateButtonError,
                  ]}
                  onPress={openStartDatePicker}
                >
                  <Text style={styles.dateButtonText} numberOfLines={1}>
                    {formatDateForDisplay(
                      formData.startDate,
                      "Pick a start date",
                    )}
                  </Text>
                </TouchableOpacity>
                {fieldErrors.startDate ? (
                  <Text style={styles.errorText}>{fieldErrors.startDate}</Text>
                ) : null}
              </View>
              <View style={styles.dateInputContainer}>
                <Text style={styles.label}>End Date (Optional)</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={openEndDatePicker}
                >
                  <Text style={styles.dateButtonText} numberOfLines={1}>
                    {formatDateForDisplay(formData.endDate, "Pick end date")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                <Text style={styles.infoBold}>Typical rental rates:</Text>{" "}
                $200-$300 per day or $800-$1,200 per week. Final pricing will be
                provided by your local rental partner.
              </Text>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <MaterialIcons name="business" size={48} color="#FF6B35" />
              <Text style={styles.stepTitle}>Tell us about yourself</Text>
              <Text style={styles.stepDescription}>
                Help us personalize your rental experience
              </Text>
            </View>
            <View style={styles.formFields}>
              <Text style={styles.rentingAsHeading}>Are you renting as?</Text>
              <View style={styles.customerTypeOptions}>
                <TouchableOpacity
                  style={[
                    styles.customerTypeCard,
                    formData.customerType === "company_contractor" &&
                      styles.customerTypeCardSelected,
                  ]}
                  onPress={() =>
                    updateFormData("customerType", "company_contractor")
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.customerTypeCardText,
                      formData.customerType === "company_contractor" &&
                        styles.customerTypeCardTextSelected,
                    ]}
                  >
                    Company / Contractor
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.customerTypeCard,
                    formData.customerType === "individual_homeowner" &&
                      styles.customerTypeCardSelected,
                  ]}
                  onPress={() =>
                    updateFormData("customerType", "individual_homeowner")
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.customerTypeCardText,
                      formData.customerType === "individual_homeowner" &&
                        styles.customerTypeCardTextSelected,
                    ]}
                  >
                    Individual / Homeowner
                  </Text>
                </TouchableOpacity>
              </View>

              {formData.customerType && (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>First Name *</Text>
                    <TextInput
                      style={[
                        styles.input,
                        fieldErrors.firstName && styles.inputError,
                      ]}
                      placeholder="Enter your First Name"
                      value={formData.firstName}
                      onChangeText={(text) => updateFormData("firstName", text)}
                    />
                    {fieldErrors.firstName ? (
                      <Text style={styles.errorText}>
                        {fieldErrors.firstName}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Last Name *</Text>
                    <TextInput
                      style={[
                        styles.input,
                        fieldErrors.lastName && styles.inputError,
                      ]}
                      placeholder="Enter your Last Name"
                      value={formData.lastName}
                      onChangeText={(text) => updateFormData("lastName", text)}
                    />
                    {fieldErrors.lastName ? (
                      <Text style={styles.errorText}>
                        {fieldErrors.lastName}
                      </Text>
                    ) : null}
                  </View>
                  {formData.customerType === "company_contractor" && (
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Company Name *</Text>
                      <TextInput
                        style={[
                          styles.input,
                          fieldErrors.companyName && styles.inputError,
                        ]}
                        placeholder="Enter your company name"
                        value={formData.companyName}
                        onChangeText={(text) =>
                          updateFormData("companyName", text)
                        }
                      />
                      {fieldErrors.companyName ? (
                        <Text style={styles.errorText}>
                          {fieldErrors.companyName}
                        </Text>
                      ) : null}
                    </View>
                  )}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Project Type</Text>
                    <TouchableOpacity
                      style={styles.selectButton}
                      onPress={() =>
                        setShowProjectTypePicker(!showProjectTypePicker)
                      }
                    >
                      <Text style={styles.selectButtonText} numberOfLines={1}>
                        {formData.projectType
                          ? PROJECT_TYPES.find(
                              (p) =>
                                p.toLowerCase().replace(/\s+/g, "-") ===
                                formData.projectType,
                            ) || formData.projectType
                          : "Select project type (optional)"}
                      </Text>
                    </TouchableOpacity>
                    {showProjectTypePicker && (
                      <View style={styles.pickerContainer}>
                        <ScrollView
                          style={styles.pickerScroll}
                          nestedScrollEnabled
                          keyboardShouldPersistTaps="handled"
                        >
                          {PROJECT_TYPES.map((type) => (
                            <TouchableOpacity
                              key={type}
                              style={styles.pickerOption}
                              onPress={() => {
                                updateFormData(
                                  "projectType",
                                  type.toLowerCase().replace(/\s+/g, "-"),
                                );
                                setShowProjectTypePicker(false);
                              }}
                            >
                              <Text style={styles.pickerOptionText}>
                                {type}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </>
              )}
            </View>
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <MaterialIcons name="phone" size={48} color="#FF6B35" />
              <Text style={styles.stepTitle}>How can we reach you?</Text>
              <Text style={styles.stepDescription}>
                We'll only use this to help set up your rental - no spam, we
                promise!
              </Text>
            </View>
            <View style={styles.formFields}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address *</Text>
                <TextInput
                  style={[styles.input, fieldErrors.email && styles.inputError]}
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChangeText={(text) => updateFormData("email", text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {fieldErrors.email ? (
                  <Text style={styles.errorText}>{fieldErrors.email}</Text>
                ) : null}
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={[styles.input, fieldErrors.phone && styles.inputError]}
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChangeText={(text) => {
                    const digitsOnly = text.replace(/\D/g, "");
                    if (digitsOnly?.length <= 10) {
                      updateFormData("phone", digitsOnly);
                    }
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                {fieldErrors.phone ? (
                  <Text style={styles.errorText}>{fieldErrors.phone}</Text>
                ) : null}
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Additional Comments</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Any specific requirements or questions about your rental?"
                  value={formData.comments}
                  onChangeText={(text) => {
                    updateFormData("comments", text.slice(0, 255));
                  }}
                  onFocus={() => {
                    // Scroll to bottom so this field stays visible above keyboard (step 5 uses marginBottom, not extra padding)
                    setTimeout(
                      () =>
                        scrollViewRef.current?.scrollToEnd({
                          animated: true,
                        }),
                      400,
                    );
                  }}
                  multiline
                  numberOfLines={3}
                  maxLength={255}
                />
                <Text style={styles.charCount}>
                  {255 - (formData.comments?.length || 0)} characters remaining
                </Text>
              </View>
            </View>
          </View>
        );

      case 6:
        return (
          <View style={styles.stepContentSuccess}>
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <MaterialIcons name="check-circle" size={56} color="#22c55e" />
              </View>
              <Text style={styles.successTitle}>Request Submitted!</Text>
              <Text style={styles.successDescription}>
                Thank you for your interest in renting the Equipter. We've found
                rental locations near you. Please contact your nearest rental
                location to confirm availability and pricing.
              </Text>
            </View>

            <View style={styles.locationCard}>
              <View style={styles.locationCardHeader}>
                <MaterialIcons name="place" size={22} color="#FF6B35" />
                <Text style={styles.locationCardTitle}>
                  Nearest Rental Location
                </Text>
              </View>
              <View style={styles.locationCardContent}>
                <Text style={styles.locationName}>{locationDetails?.name}</Text>
                {locationDetails?.street && (
                  <View style={styles.locationDetail}>
                    <MaterialIcons name="place" size={16} color="#FF6B35" />
                    <Text style={styles.locationText}>
                      {locationDetails?.street} - {locationDetails?.state} -{" "}
                      {locationDetails?.country} - {locationDetails?.zip}
                    </Text>
                  </View>
                )}
                <View style={styles.locationDetail}>
                  <MaterialIcons name="access-time" size={16} color="#FF6B35" />
                  <Text style={styles.locationText}>
                    Approx {Number(locationDetails?.distance).toFixed(1)}{" "}
                    {locationDetails?.distance == "1" ? "mile" : "miles"} from
                    your location
                  </Text>
                </View>
                {locationDetails?.phone && (
                  <PhoneDialer phone={locationDetails?.phone} />
                )}
              </View>
            </View>

            <View style={styles.nextSteps}>
              <Text style={styles.nextStepsTitle}>What next?</Text>
              <View style={styles.nextStepItem}>
                <View style={styles.nextStepIcon}>
                  <MaterialIcons
                    name="attach-money"
                    size={20}
                    color="#FF6B35"
                  />
                </View>
                <Text style={styles.nextStepText}>
                  Contact {locationDetails?.name} to confirm availability and
                  receive final pricing.
                </Text>
              </View>
              <View style={styles.nextStepItem}>
                <View style={styles.nextStepIcon}>
                  <MaterialIcons name="phone" size={20} color="#FF6B35" />
                </View>
                <Text style={styles.nextStepText}>
                  For any additional assistance, please feel free to contact an
                  Equipter specialist at (717) 425-2683
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => openUrl(EQUIPTER_RENT_URL)}
            >
              <Text style={styles.viewAllButtonText}>
                View All Rental Locations
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.goToHomeButton}
              onPress={() => router.replace("/")}
              activeOpacity={0.85}
            >
              <Ionicons name="home" size={22} color="#fff" />
              <Text style={styles.goToHomeButtonText}>Main Screen</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  const bottomBarPadding = { paddingBottom: Math.max(insets.bottom, 16) };
  const BOTTOM_BAR_HEIGHT = 100;
  const scrollContentPaddingBottom =
    BOTTOM_BAR_HEIGHT + Math.max(insets.bottom, 16);

  /** Steps 2, 4, 5: content top-aligned and not stretched (scrollable list/form). Steps 1, 3: centered. */
  const contentStyle = [
    styles.content,
    currentStep === 2 || currentStep === 4 || currentStep === 5
      ? styles.contentTop
      : styles.contentCentered,
    (currentStep === 2 || currentStep === 4 || currentStep === 5) &&
      styles.contentNoGrow,
  ];

  // --- Success step (6): scrollable page with no bottom bar; "Go to Home" in content ---
  if (currentStep === 6) {
    return (
      <View style={styles.wrapper}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            styles.contentTop,
            { paddingBottom: 32 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={true}
        >
          <View style={styles.formArea}>
            <View style={styles.cardContent}>{renderStepContent()}</View>
          </View>
        </ScrollView>
      </View>
    );
  }

  /** Shared layout for steps 1–5: scrollable form + Previous/Next (or Submit) bar */
  const scrollAndBottomBar = (
    <>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          contentStyle,
          { paddingBottom: scrollContentPaddingBottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        scrollEnabled={
          currentStep === 2 || currentStep === 4 || currentStep === 5
        }
      >
        <View style={styles.formArea}>
          {apiError ? (
            <View style={styles.apiErrorBanner}>
              <Text style={styles.apiErrorBannerText}>{apiError}</Text>
            </View>
          ) : null}
          <View style={styles.cardContent}>{renderStepContent()}</View>
        </View>
      </ScrollView>
      <View style={[styles.bottomBar, bottomBarPadding]}>
        <View style={styles.bottomBarActions}>
          <TouchableOpacity
            style={[
              styles.footerButton,
              styles.footerButtonOutline,
              currentStep === 1 && styles.buttonDisabled,
            ]}
            onPress={handlePrevious}
            disabled={currentStep === 1}
          >
            <Text style={styles.footerButtonOutlineText}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.footerButton,
              styles.footerButtonPrimary,
              isSubmitting && styles.buttonDisabled,
            ]}
            onPress={handleNext}
            disabled={isSubmitting}
          >
            <Text style={styles.footerButtonPrimaryText}>
              {currentStep === totalSteps ? "Submit Request" : "Next Step"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  return (
    <View style={styles.wrapper}>
      {/* Step 5: no KeyboardAvoidingView; use marginBottom = keyboard height so form ends at keyboard (no gap). Other steps: use KeyboardAvoidingView. */}
      {currentStep === 5 ? (
        <View
          style={[
            styles.keyboardAvoid,
            keyboardHeight > 0 && { marginBottom: 100 },
          ]}
        >
          {scrollAndBottomBar}
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
          {scrollAndBottomBar}
        </KeyboardAvoidingView>
      )}

      {/* iOS date pickers: shown below the buttons; tap backdrop to close. Date updates live as user scrolls. */}
      {showStartDatePicker && Platform.OS === "ios" && (
        <View style={styles.datePickerOverlay} pointerEvents="box-none">
          <Pressable
            style={styles.datePickerBackdrop}
            onPress={() => setShowStartDatePicker(false)}
          />
          <View style={styles.datePickerVisible}>
            <DateTimePicker
              value={toDate(formData.startDate, today)}
              mode="date"
              display="spinner"
              minimumDate={today}
              maximumDate={
                formData.endDate
                  ? addDays(toDate(formData.endDate, today), -1)
                  : undefined
              }
              themeVariant="light"
              textColor="#111827"
              accentColor="#FF6B35"
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  updateFormData("startDate", new Date(selectedDate.getTime()));
                }
              }}
            />
          </View>
        </View>
      )}

      {showEndDatePicker && Platform.OS === "ios" && (
        <View style={styles.datePickerOverlay} pointerEvents="box-none">
          <Pressable
            style={styles.datePickerBackdrop}
            onPress={() => setShowEndDatePicker(false)}
          />
          <View style={styles.datePickerVisible}>
            <DateTimePicker
              value={
                formData.endDate
                  ? toDate(formData.endDate, today)
                  : addDays(toDate(formData.startDate, today), 1)
              }
              mode="date"
              display="spinner"
              minimumDate={toDate(formData.startDate, today)}
              themeVariant="light"
              textColor="#111827"
              accentColor="#FF6B35"
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  updateFormData("endDate", new Date(selectedDate.getTime()));
                }
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
};

// --- Layout and form styles (steps, inputs, buttons, date picker, success) ---
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  contentNoGrow: {
    flexGrow: 0,
  },
  contentCentered: {
    justifyContent: "center",
  },
  contentTop: {
    justifyContent: "flex-start",
  },
  keyboardAvoid: {
    flex: 1,
  },
  formArea: {
    width: "100%",
  },
  cardContent: {
    padding: 16,
  },
  stepContent: {
    gap: 24,
  },
  stepHeader: {
    alignItems: "center",
    gap: 8,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
  },
  stepDescription: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "#dc2626",
    borderWidth: 2,
    backgroundColor: "#fef2f2",
  },
  errorText: {
    fontSize: 13,
    color: "#dc2626",
    marginTop: 4,
  },
  apiErrorBanner: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  apiErrorBannerText: {
    fontSize: 14,
    color: "#dc2626",
    fontWeight: "500",
  },
  dateButtonError: {
    borderColor: "#dc2626",
    borderWidth: 2,
    backgroundColor: "#fef2f2",
  },
  equipmentListError: {
    borderWidth: 2,
    borderColor: "#dc2626",
    borderRadius: 12,
    padding: 2,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "right",
  },
  equipmentList: {
    gap: 12,
  },
  equipmentCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  equipmentCardSelected: {
    borderColor: "#FF6B35",
    borderWidth: 2,
    backgroundColor: "#fff5f0",
    ...Platform.select({
      ios: {
        shadowColor: "#FF6B35",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  equipmentCardTouchable: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 72,
  },
  equipmentThumbnail: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },
  equipmentInfo: {
    flex: 1,
    marginLeft: 14,
    gap: 4,
    justifyContent: "center",
  },
  equipmentLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  watchVideoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0f172a",
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 53, 0.4)",
  },
  watchVideoButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  equipmentDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  dateContainer: {
    gap: 16,
  },
  dateInputContainer: {
    gap: 8,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  dateButtonText: {
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "500",
  },
  datePickerOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flex: 1,
    justifyContent: "flex-end",
  },
  datePickerBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  datePickerVisible: {
    padding: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  infoBox: {
    backgroundColor: "#f3f4f6",
    padding: 16,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#6b7280",
  },
  infoBold: {
    fontWeight: "600",
  },
  formFields: {
    gap: 16,
  },
  rentingAsHeading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 16,
    textAlign: "center",
  },
  customerTypeOptions: {
    gap: 12,
    marginBottom: 8,
  },
  customerTypeCard: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  customerTypeCardSelected: {
    borderColor: "#FF6B35",
    backgroundColor: "#fff5f0",
  },
  customerTypeCardText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4b5563",
  },
  customerTypeCardTextSelected: {
    color: "#FF6B35",
  },
  selectButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  selectButtonText: {
    fontSize: 16,
    color: "#1f2937",
  },
  pickerContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#fff",
    maxHeight: 220,
    overflow: "hidden",
  },
  pickerScroll: {
    maxHeight: 220,
  },
  pickerOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  pickerOptionText: {
    fontSize: 15,
    color: "#1f2937",
  },
  bottomBar: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  bottomBarActions: {
    flexDirection: "row",
    gap: 12,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  footerButtonPrimary: {
    backgroundColor: "#FF6B35",
  },
  footerButtonOutline: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  footerButtonPrimaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footerButtonOutlineText: {
    color: "#1f2937",
    fontSize: 16,
    fontWeight: "500",
  },
  stepContentSuccess: {
    gap: 24,
    paddingBottom: 24,
  },
  successContainer: {
    alignItems: "center",
    gap: 18,
    marginBottom: 8,
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: "rgba(15, 23, 42, 0.04)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.2)",
    ...Platform.select({
      ios: {
        shadowColor: "#22c55e",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(34, 197, 94, 0.4)",
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#16a34a",
    letterSpacing: 0.5,
  },
  successDescription: {
    fontSize: 15,
    color: "#475569",
    textAlign: "center",
    maxWidth: 400,
    lineHeight: 22,
  },
  locationCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  locationCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 18,
    backgroundColor: "#0f172a",
    borderBottomWidth: 2,
    borderBottomColor: "rgba(255, 107, 53, 0.3)",
  },
  locationCardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#f8fafc",
    letterSpacing: 0.3,
  },
  locationCardContent: {
    padding: 18,
    gap: 12,
    backgroundColor: "#fff",
  },
  locationName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  locationDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: "#475569",
  },
  nextSteps: {
    gap: 16,
    marginBottom: 20,
    padding: 18,
    backgroundColor: "rgba(15, 23, 42, 0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  nextStepItem: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  nextStepIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "rgba(255, 107, 53, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  nextStepText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    lineHeight: 21,
  },
  viewAllButton: {
    borderWidth: 2,
    borderColor: "#e2e8f0",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  viewAllButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    letterSpacing: 0.3,
  },
  goToHomeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#FF6B35",
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 14,
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: "#FF6B35",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
    }),
  },
  goToHomeButtonText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
});

export default RentalRequestForm;
