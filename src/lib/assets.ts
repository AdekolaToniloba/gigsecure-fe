// Auto-generated assets file
import { env } from '@/lib/env';

export const ASSETS_URL = env.NEXT_PUBLIC_ASSETS_URL || '';

export const assetUrl = (path: string) => {
  if (ASSETS_URL) {
    return `${ASSETS_URL}/${path}`;
  }
  // Fallback for local development if ASSETS_URL is empty
  return `/assets/${path}`;
};

export const ASSETS = {
  "logo": "images/logo.png",
  "img413aa6d39706739b55c3d3547197c15e8942316d": "images/413aa6d39706739b55c3d3547197c15e8942316d.webp",
  "img77b7b280d62e8e9a4f26c135f20e276995476f53": "images/77b7b280d62e8e9a4f26c135f20e276995476f53.webp",
  "img7aaf320626defa49daffc84b4be9093d38323454": "images/7aaf320626defa49daffc84b4be9093d38323454.webp",
  "group57": "images/Group_57.webp",
  "a409bd93db42a474a79d789c5121daaf7783679d": "images/a409bd93db42a474a79d789c5121daaf7783679d.webp",
  "a6240d543a2fedd60dfd5beb2da99377a37a0c93": "images/a6240d543a2fedd60dfd5beb2da99377a37a0c93.webp",
  "about": {
    "img21489206031": "images/about/2148920603_1.webp",
    "rectangle129": "images/about/Rectangle_129.webp",
    "rectangle133": "images/about/Rectangle_133.webp",
    "rectangle146": "images/about/Rectangle_146.webp",
    "rectangle149": "images/about/Rectangle_149.webp"
  },
  "e24691b767ceaed733586e12832b4d03537422cc": "images/e24691b767ceaed733586e12832b4d03537422cc.webp",
  "ff066588c527ccd21434dec0d44a32b6f4062ba6": "images/ff066588c527ccd21434dec0d44a32b6f4062ba6.webp",
  "riskAssessment": {
    "rectangle100": "images/risk-assessment/Rectangle_100.webp",
    "rectangle101": "images/risk-assessment/Rectangle_101.webp",
    "rectangle102": "images/risk-assessment/Rectangle_102.webp",
    "rectangle103": "images/risk-assessment/Rectangle_103.webp",
    "rectangle117": "images/risk-assessment/Rectangle_117.webp",
    "rectangle119": "images/risk-assessment/Rectangle_119.webp",
    "rectangle125": "images/risk-assessment/Rectangle_125.webp",
    "rectangle129": "images/risk-assessment/Rectangle_129.webp",
    "rectangle92": "images/risk-assessment/Rectangle_92.webp",
    "rectangle98": "images/risk-assessment/Rectangle_98.webp"
  }
};
