import type { Model } from "../content/types";

/** Generated from assets/ui/model-placeholders by scripts/make_brand_assets.swift. */
export const modelImages: Record<Model, { body: number; profile: number }> = {
  male: {
    body: require("../../assets/ui/models/male-body.png"),
    profile: require("../../assets/ui/models/male-profile.png"),
  },
  female: {
    body: require("../../assets/ui/models/female-body.png"),
    profile: require("../../assets/ui/models/female-profile.png"),
  },
};
