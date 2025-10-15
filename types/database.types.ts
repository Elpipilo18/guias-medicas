export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "editor" | "viewer";
  specialty: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface MedicalGuide {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  file_url: string;
  file_type: string | null;
  tags: string[] | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  is_published: boolean;
}
