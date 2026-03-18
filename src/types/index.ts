export type UserRole = 'admin' | 'client' | 'subcontractor'
export type ProjectStatus = 'pre_construction' | 'active' | 'on_hold' | 'completed'
export type SelectionStatus = 'pending' | 'submitted' | 'approved' | 'revision_needed'
export type DocumentCategory =
  | 'contract'
  | 'change_order'
  | 'plans'
  | 'permit'
  | 'inspection'
  | 'warranty'
  | 'invoice'
  | 'photo'
  | 'other'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: UserRole
  company_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  address: string
  client_id: string | null
  status: ProjectStatus
  start_date: string | null
  estimated_completion: string | null
  actual_completion: string | null
  contract_value: number | null
  description: string | null
  cover_image_url: string | null
  progress_percent: number
  created_by: string | null
  created_at: string
  updated_at: string
  // joined
  client?: Profile
}

export interface ProjectPhase {
  id: string
  project_id: string
  name: string
  description: string | null
  sort_order: number
  start_date: string | null
  end_date: string | null
  status: 'pending' | 'active' | 'completed'
  created_at: string
  updated_at: string
  tasks?: Task[]
}

export interface Task {
  id: string
  project_id: string
  phase_id: string | null
  name: string
  description: string | null
  due_date: string | null
  completed_date: string | null
  is_completed: boolean
  sort_order: number
  assigned_to: string | null
  created_at: string
  updated_at: string
}

export interface Selection {
  id: string
  project_id: string
  category: string
  item_name: string
  description: string | null
  deadline: string | null
  status: SelectionStatus
  client_choice: string | null
  client_notes: string | null
  builder_notes: string | null
  sort_order: number
  submitted_at: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  project_id: string
  name: string
  category: DocumentCategory
  file_url: string
  file_size: number | null
  file_type: string | null
  description: string | null
  visible_to_client: boolean
  visible_to_subs: boolean
  uploaded_by: string | null
  created_at: string
}

export interface Announcement {
  id: string
  project_id: string
  title: string
  body: string
  icon: string
  is_urgent: boolean
  published: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Milestone {
  id: string
  project_id: string
  name: string
  description: string | null
  due_date: string
  completed_date: string | null
  is_completed: boolean
  sort_order: number
  created_at: string
}
