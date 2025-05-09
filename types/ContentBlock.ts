export interface ContentBlock {
  _id: string;
  type: string;
  content: string;
  imageSrc?: string;
  imageAlt?: string;
  linkUrl?: string;
  imagePublicId?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  order: number;
  sectionId: string;
  createdAt: string;
  updatedAt: string;
} 