/**
 * APP CONTEXT
 * Equipment "models" and rental form ref from Sanity (Equipter-Sanity rental page).
 * - models: mapped from filterableProducts; used by HeroImageCarousel and RentalRequestForm.
 * - formRef: Sanity form document _ref for submitting rental via /api/forms/submit.
 * - fetchModels(): fetches rental page from Sanity and sets models + formRef.
 */

import { createContext, useContext, useState, ReactNode } from "react";
import { fetchRentalPage } from "@/lib/sanityQueries";
import { sanityImageBuilder, isSanityConfigured } from "@/lib/sanity";

export interface Model {
  sfid: string;
  code__c: string;
  name__c: string;
  blurb__c: string;
  image_url__c: string;
  video_url__c?: string;
}

export interface AppContextType {
  models: Model[];
  formRef: string | null;
  isModelsLoading: boolean;
  modelError: string | null;
  fetchModels: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

function mapProductToModel(p: any): Model {
  const slug = typeof p?.slug === "string" ? p.slug : "";
  const imageRef = p?.productHero?.backgroundImage?.asset;
  const imageUrl = imageRef
    ? sanityImageBuilder.image(imageRef).width(600).url()
    : "";
  const firstStat = Array.isArray(p?.stats) && p.stats[0] ? p.stats[0] : null;
  const blurb = firstStat
    ? [firstStat.title, firstStat.value, firstStat.unit].filter(Boolean).join(" ")
    : "";
  const video = p?.video;
  let videoUrl = "";
  if (video?.videoType === "url" && video?.videoUrl) videoUrl = video.videoUrl;
  else if (video?.videoType === "youtube" && video?.videoId)
    videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
  else if (video?.videoType === "wistia" && video?.videoId)
    videoUrl = `https://fast.wistia.net/embed/iframe/${video.videoId}`;
  else if (video?.videoFile) videoUrl = video.videoFile;

  const code = slug ? slug : (p?.name ?? "");
  return {
    sfid: p?._id ?? "",
    code__c: code,
    name__c: p?.name ?? "",
    blurb__c: blurb,
    image_url__c: imageUrl,
    video_url__c: videoUrl || undefined,
  };
}

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  const [models, setModels] = useState<Model[]>([]);
  const [formRef, setFormRef] = useState<string | null>(null);
  const [isModelsLoading, setIsModelsLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  const fetchModels = async () => {
    if (!isSanityConfigured()) {
      setModelError("Sanity not configured");
      return;
    }
    try {
      setIsModelsLoading(true);
      setModelError(null);
      const data = await fetchRentalPage();
      if (!data) {
        setModels([]);
        setFormRef(null);
        return;
      }
      const rental = (data as any)?.rentalRequestPage;
      const products = rental?.filterableProducts ?? [];
      setModels(products.map(mapProductToModel).filter((m: Model) => m.sfid));
      const ref = rental?.form?._ref ?? rental?.form ?? null;
      setFormRef(typeof ref === "string" ? ref : null);
    } catch (err: any) {
      setModelError(err?.message || "Failed to load equipment");
      setModels([]);
      setFormRef(null);
    } finally {
      setIsModelsLoading(false);
    }
  };

  return (
    <AppContext.Provider
      value={{ models, formRef, isModelsLoading, modelError, fetchModels }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppContextProvider");
  }
  return context;
};
