import { createContext, useContext, useState, ReactNode } from "react";
import axiosClient from "@/lib/utils";

interface Model {
  sfid: string;
  code__c: string;
  name__c: string;
  blurb__c: string;
  image_url__c: string;
  video_url__c?: string;
}

interface AppContextType {
  models: Model[];
  isModelsLoading: boolean;
  modelError: string | null;
  fetchModels: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  const [models, setModels] = useState<Model[]>([]);
  const [isModelsLoading, setIsModelsLoading] = useState(false);
  const [modelError, setIsModelError] = useState<string | null>(null);

  const fetchModels = async () => {
    try {
      setIsModelsLoading(true);
      setIsModelError(null);
      const res = await axiosClient.get(`/models`);
      setModels(res.data.data);
    } catch (err: any) {
      setIsModelError(err.message || "Something went wrong");
    } finally {
      setIsModelsLoading(false);
    }
  };

  return (
    <AppContext.Provider
      value={{ models, isModelsLoading, modelError, fetchModels }}
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

