import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Image,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { AxiosResponse } from "axios";
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from "date-fns";
import { 
  MaterialIcons,
  Feather,
  Ionicons,
} from "@expo/vector-icons";
import axiosClient from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/AppContext";
import { PhoneDialer } from "./PhoneDialer";
import { Loader } from "./Loader";
import { EQUIPTER_RENT_URL } from "@/lib/useEnv";

const today = new Date();
today.setHours(0, 0, 0, 0);

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

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
export const LOCAL_LEAD_KEY = "formID";
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

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

const RentalRequestForm: React.FC = () => {
  const [equipmentOptions, setEquipmentOptions] = useState<any[]>([]);
  const [formData, setFormData] = useState<FormData>({
    zipCode: "",
    status: "draft",
    equipment: "",
    startDate: undefined,
    endDate: undefined,
    customerType: "company_contractor",
    companyName: "",
    projectType: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    comments: "",
  });
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
  const { toast } = useToast();
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showProjectTypePicker, setShowProjectTypePicker] = useState(false);

  const progressPercentage = (currentStep / totalSteps) * 100;

  const buildPayload = (
    overrides: Record<string, string | number | boolean | Date | null> = {}
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

  async function createOrUpdateLead(stepNumber?: number) {
    setIsSubmitting(true);
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
      if (err?.response?.status === 400 && err.response.data.message == "Invalid zip code") {
        toast({
          title: `Enter the valid Zip code`,
          description: "The Postal Code should be valid",
          variant: "destructive",
        });
        return;
      }
      if (err?.response?.status === 429) {
        toast({
          title: `Too many requests`,
          description: "Please Try Again in 15 minutes",
          variant: "destructive",
        });
        return;
      }
      if (err?.response?.status === 404 || err.response.data.message == "Failed to update lead") {
        if (formData.zipCode == null) {
          setCurrentStep(1);
          return;
        }
        await AsyncStorage.removeItem(LOCAL_LEAD_KEY);
        const createUrl = `/lead`;
        const createPayload = buildPayload({ step__c: stepNumber || currentStep });
        const createResult = await axiosClient.post(createUrl, createPayload, { timeout: 10000 });
        const leadID = createResult.data?.data.id;
        await AsyncStorage.setItem(LOCAL_LEAD_KEY, String(leadID));
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
        return;
      }
      toast({
        title: `Failed to Submit,Please Try Again Later`,
        description: "There is some issue while submitting your request!",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleNext = async () => {
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
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    switch (currentStep) {
      case 1:
        if (!formData.zipCode || formData.zipCode?.length < 5) {
          toast({
            title: "Please enter a valid ZIP code",
            description: "We need your location to find nearby rental options.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      case 2:
        if (!formData.equipment) {
          toast({
            title: "Please select equipment",
            description: "Choose the Equipter model you'd like to rent.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      case 3:
        if (!formData.startDate) {
          toast({
            title: "Please select a start date",
            description: "When do you need the equipment?",
            variant: "destructive",
          });
          return false;
        }
        return true;
      case 4:
        if (!formData.firstName.trim()) {
          toast({
            title: "Please enter your First Name",
            description: "We need to know who to contact about your rental.",
            variant: "destructive",
          });
          return false;
        }
        if (!formData.lastName.trim()) {
          toast({
            title: "Please enter your Last Name",
            description: "We need to know who to contact about your rental.",
            variant: "destructive",
          });
          return false;
        }
        if (
          formData.customerType === "company_contractor" &&
          !formData.companyName.trim()
        ) {
          toast({
            title: "Please enter your company name",
            description:
              "Company information is required for business rentals.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      case 5:
        if (!formData.email) {
          toast({
            title: "Please provide  contact email",
            description:
              "We need your email and phone to assist with your rental.",
            variant: "destructive",
          });
          return false;
        }
        if (!emailRegex.test(formData.email)) {
          toast({
            title: "Please provide valid email address",
            description: "The email format is invalid.",
            variant: "destructive",
          });
          return false;
        }
        if (!formData.phone || formData.phone?.length < 10) {
          toast({
            title:
              formData.phone?.length < 10
                ? `Please provide valid contact phone`
                : `Please provide  contact phone`,
            description:
              "We need your email and phone to assist with your rental.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const updateFormData = (
    field: keyof FormData,
    value: string | number | Date | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

  useEffect(() => {
    if (currentStep == 6) {
      AsyncStorage.removeItem(LOCAL_LEAD_KEY);
    }
  }, [currentStep]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <MaterialIcons name="place" size={48} color="#FF6B35" />
              <Text style={styles.stepTitle}>Where do you need the equipment?</Text>
              <Text style={styles.stepDescription}>
                Enter your ZIP code to find nearby Equipter rental locations
              </Text>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>ZIP Code *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your ZIP code"
                value={formData.zipCode}
                onChangeText={(text) => {
                  const digits = text.replace(/\D/g, "").slice(0, 10);
                  updateFormData("zipCode", digits);
                }}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <MaterialIcons name="build" size={48} color="#FF6B35" />
              <Text style={styles.stepTitle}>What Equipter equipment do you need?</Text>
              <Text style={styles.stepDescription}>
                Select the model that best fits your project requirements
              </Text>
            </View>
            <ScrollView style={styles.equipmentList}>
              {equipmentOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.equipmentCard,
                    formData.equipment === option.value && styles.equipmentCardSelected,
                  ]}
                  onPress={() => updateFormData("equipment", option.value)}
                >
                  <View style={styles.equipmentCardContent}>
                    <View
                      style={[
                        styles.radio,
                        formData.equipment === option.value && styles.radioSelected,
                      ]}
                    />
                    <Image
                      source={typeof option.thumbnail === 'string' ? { uri: option.thumbnail } : option.thumbnail}
                      style={styles.equipmentThumbnail}
                    />
                    <View style={styles.equipmentInfo}>
                      <Text style={styles.equipmentLabel}>{option.label}</Text>
                      <Text style={styles.equipmentDescription}>{option.description}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
                  style={styles.dateButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {formData.startDate
                      ? format(formData.startDate, "PPP")
                      : "Pick a start date"}
                  </Text>
                </TouchableOpacity>
                {showStartDatePicker && (
                  <DateTimePicker
                    value={formData.startDate || new Date()}
                    mode="date"
                    display="default"
                    minimumDate={today}
                    maximumDate={formData.endDate ? addDays(formData.endDate, -1) : undefined}
                    onChange={(event, selectedDate) => {
                      setShowStartDatePicker(Platform.OS === 'ios');
                      if (selectedDate) {
                        updateFormData("startDate", selectedDate);
                      }
                    }}
                  />
                )}
              </View>
              <View style={styles.dateInputContainer}>
                <Text style={styles.label}>End Date (Optional)</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {formData.endDate
                      ? format(formData.endDate, "PPP")
                      : "Pick end date"}
                  </Text>
                </TouchableOpacity>
                {showEndDatePicker && (
                  <DateTimePicker
                    value={formData.endDate || addDays(formData.startDate || today, 1)}
                    mode="date"
                    display="default"
                    minimumDate={formData.startDate || today}
                    onChange={(event, selectedDate) => {
                      setShowEndDatePicker(Platform.OS === 'ios');
                      if (selectedDate) {
                        updateFormData("endDate", selectedDate);
                      }
                    }}
                  />
                )}
              </View>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                <Text style={styles.infoBold}>Typical rental rates:</Text> $200-$300 per day or
                $800-$1,200 per week. Final pricing will be provided by your
                local rental partner.
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
              <Text style={styles.label}>Are you renting as a... *</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => updateFormData("customerType", "company_contractor")}
                >
                  <View style={[styles.radioCircle, formData.customerType === "company_contractor" && styles.radioCircleSelected]} />
                  <Text>Company/Contractor</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => updateFormData("customerType", "individual_homeowner")}
                >
                  <View style={[styles.radioCircle, formData.customerType === "individual_homeowner" && styles.radioCircleSelected]} />
                  <Text>Individual/Homeowner</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your First Name"
                  value={formData.firstName}
                  onChangeText={(text) => updateFormData("firstName", text)}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your Last Name"
                  value={formData.lastName}
                  onChangeText={(text) => updateFormData("lastName", text)}
                />
              </View>
              {formData.customerType === "company_contractor" && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Company Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your company name"
                    value={formData.companyName}
                    onChangeText={(text) => updateFormData("companyName", text)}
                  />
                </View>
              )}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Project Type</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowProjectTypePicker(true)}
                >
                  <Text style={styles.selectButtonText}>
                    {formData.projectType || "Select project type (optional)"}
                  </Text>
                </TouchableOpacity>
                {showProjectTypePicker && (
                  <View style={styles.pickerContainer}>
                    {PROJECT_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={styles.pickerOption}
                        onPress={() => {
                          updateFormData("projectType", type.toLowerCase().replace(" ", "-"));
                          setShowProjectTypePicker(false);
                        }}
                      >
                        <Text>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
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
                  style={styles.input}
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChangeText={(text) => updateFormData("email", text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={styles.input}
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
          <View style={styles.stepContent}>
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <MaterialIcons name="check-circle" size={48} color="#10b981" />
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
                <MaterialIcons name="place" size={20} color="#FF6B35" />
                <Text style={styles.locationCardTitle}>Nearest Rental Location</Text>
              </View>
              <View style={styles.locationCardContent}>
                <Text style={styles.locationName}>{locationDetails?.name}</Text>
                {locationDetails?.street && (
                  <View style={styles.locationDetail}>
                    <MaterialIcons name="place" size={16} color="#FF6B35" />
                    <Text style={styles.locationText}>
                      {locationDetails?.street} - {locationDetails?.state} - {locationDetails?.country} - {locationDetails?.zip}
                    </Text>
                  </View>
                )}
                <View style={styles.locationDetail}>
                  <MaterialIcons name="access-time" size={16} color="#FF6B35" />
                  <Text style={styles.locationText}>
                    Approx {Number(locationDetails?.distance).toFixed(1)} {locationDetails?.distance == "1" ? "mile" : "miles"} from your location
                  </Text>
                </View>
                {locationDetails?.phone && <PhoneDialer phone={locationDetails?.phone} />}
              </View>
            </View>

            <View style={styles.nextSteps}>
              <Text style={styles.nextStepsTitle}>What next?</Text>
              <View style={styles.nextStepItem}>
                <View style={styles.nextStepIcon}>
                  <MaterialIcons name="attach-money" size={20} color="#FF6B35" />
                </View>
                <Text style={styles.nextStepText}>
                  Contact {locationDetails?.name} to confirm availability and receive final pricing.
                </Text>
              </View>
              <View style={styles.nextStepItem}>
                <View style={styles.nextStepIcon}>
                  <MaterialIcons name="phone" size={20} color="#FF6B35" />
                </View>
                <Text style={styles.nextStepText}>
                  For any additional assistance, please feel free to contact an Equipter specialist at (717) 425-2683
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => Linking.openURL(EQUIPTER_RENT_URL)}
            >
              <Text style={styles.viewAllButtonText}>View All Rental Locations</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  if (currentStep === 6) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardContent}>{renderStepContent()}</View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progressPercentage}%` }]}
            />
          </View>
          <Text style={styles.stepIndicator}>
            Step {currentStep} of {totalSteps}
          </Text>
        </View>
        <View style={styles.cardContent}>
          {renderStepContent()}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonOutline, currentStep === 1 && styles.buttonDisabled]}
              onPress={handlePrevious}
              disabled={currentStep === 1}
            >
              <Text style={styles.buttonOutlineText}>Previous</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, isSubmitting && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonPrimaryText}>
                  {currentStep === totalSteps ? "Submit Request" : "Next Step"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FF6B35",
    borderRadius: 4,
  },
  stepIndicator: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
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
    maxHeight: 400,
  },
  equipmentCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
  },
  equipmentCardSelected: {
    borderColor: "#FF6B35",
    borderWidth: 2,
    backgroundColor: "#fff5f0",
  },
  equipmentCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#9ca3af",
  },
  radioSelected: {
    borderColor: "#FF6B35",
    backgroundColor: "#FF6B35",
  },
  equipmentThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  equipmentInfo: {
    flex: 1,
    gap: 4,
  },
  equipmentLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  equipmentDescription: {
    fontSize: 14,
    color: "#6b7280",
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
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#d1d5db",
  },
  radioCircleSelected: {
    borderColor: "#FF6B35",
    backgroundColor: "#FF6B35",
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
    maxHeight: 200,
  },
  pickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  buttonPrimary: {
    backgroundColor: "#FF6B35",
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPrimaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonOutlineText: {
    color: "#1f2937",
    fontSize: 16,
    fontWeight: "500",
  },
  successContainer: {
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#10b981",
  },
  successDescription: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    maxWidth: 400,
  },
  locationCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
  },
  locationCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
    backgroundColor: "#fff5f0",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  locationCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  locationCardContent: {
    padding: 16,
    gap: 12,
  },
  locationName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  locationDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: "#6b7280",
  },
  nextSteps: {
    gap: 16,
    marginBottom: 24,
  },
  nextStepsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  nextStepItem: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  nextStepIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#fff5f0",
    alignItems: "center",
    justifyContent: "center",
  },
  nextStepText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
    lineHeight: 20,
  },
  viewAllButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  viewAllButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
  },
});

export default RentalRequestForm;

