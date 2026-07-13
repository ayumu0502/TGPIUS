export type AccountType = "fan" | "athlete" | "sponsor";

export interface Profile {
  id: string;
  name: string;
  email: string;
  account_type: AccountType;
  created_at: string;
  updated_at: string;
  is_admin?: boolean;
  is_suspended?: boolean;
}

export interface AuthFormState {
  error?: string;
  success?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password" | "accountType", string>>;
}
