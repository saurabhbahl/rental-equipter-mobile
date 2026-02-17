/**
 * GROQ queries for Sanity (same content as Equipter-Sanity frontend).
 * Use with sanityClient.fetch() from lib/sanity.ts.
 */

import { sanityClient, isSanityConfigured } from "./sanity";

/**
 * Rental page singleton – same query shape as Equipter-Sanity frontend rentalPageQuery.
 * Use for rental form labels, steps, products, and success page content.
 */
export const RENTAL_PAGE_QUERY = /* groq */ `
  *[_type == "rentalPages" && _id == "rentalPages"][0]{
    _id,
    _type,
    "rentalRequestPage": rentalRequestPage{
      _type,
      seo{ metaTitle, metaDescription, ogImage{..., asset->} },
      title,
      showProgressBar,
      backButtonText,
      nextButtonText,
      submitButtonText,
      consentText,
      backToHomeText,
      submittingText,
      progressBarText,
      form,
      "filterableProducts": coalesce(filterableProducts, stepsDetail.step2.filterableProducts)[]->{
        _id,
        name,
        "slug": slug.current,
        "productHero": productHero{
          backgroundImage{..., asset->}
        },
        "stats": stats[]{
          title,
          value,
          unit
        },
        video{..., "videoFile": videoFile.asset->url}
      },
      "enableNotSure": coalesce(enableNotSure, stepsDetail.step2.enableNotSure),
      "notSureProductTitle": coalesce(notSureProductTitle, stepsDetail.step2.notSureProductTitle),
      "notSureProductDescription": coalesce(notSureProductDescription, stepsDetail.step2.notSureProductDescription),
      "notSureProductImage": coalesce(notSureProductImage, stepsDetail.step2.notSureProductImage){..., asset->},
      stepsDetail{
        step1{ icon, title, description },
        step2{ icon, title, description, filterableProducts, enableNotSure, notSureProductTitle, notSureProductDescription, notSureProductImage },
        step3{ icon, title, description, fields, footerNote },
        step4{ icon, title, description, fields },
        step5{ icon, title, description, fields },
        step6{ icon, title, description, fields, reviewFields }
      },
      errorMessages{ invalidZip, unableToValidateZip, submissionError },
      reviewLabels{ location, equipment }
    },
    "successPage": successPage{
      seo{ metaTitle, metaDescription, ogImage{..., asset->} },
      title,
      message,
      nearestLocationTitle,
      loadingMessage,
      noLocationMessage,
      selectedEquipmentLabel,
      errorHeading,
      returnToFormButton,
      supportPhone,
      whatNextTitle,
      whatNextSteps[]{ stepNumber, icon, text },
      viewAllLocationsButtonText,
      viewAllLocationsLink
    }
  }
`;

export type RentalPageResult = Awaited<ReturnType<typeof fetchRentalPage>>;

/**
 * Fetches rental page content from Sanity (Equipter-Sanity dataset).
 */
export async function fetchRentalPage() {
  if (!isSanityConfigured()) {
    return null;
  }
  return sanityClient.fetch<unknown>(RENTAL_PAGE_QUERY);
}
