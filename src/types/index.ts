export interface SkillProfile {
  core_competencies: string[];
  ancillary_skills: string[];
  informal_experience: string[];
  certifications: {
    name: string;
    issuer: string;
    proof_url: string;
    verified: boolean;
  }[];
  confidence_gap: string[];
  learning_velocity: string;
}

export interface Opportunity {
  platform: string;
  type: 'LinkedIn'|'Facebook'|'Quora'|'Local';
  tactic: string;
  search_terms: string[];
}

export interface LearningResource {
  topic: string;
  source: string;
  url: string;
}

export interface PitchSlide {
  title: string;
  content: string[];
  visual_hint: string;
}

export interface BusinessPlan {
  executive_summary: string;
  problem_solution: {
    problem: string;
    solution: string;
    unique_value_proposition: string;
  };
  market_analysis: {
    definition: string;
    size_growth: string;
    segments: string[];
    competition: string;
  };
  operations_plan: {
    ten_day_roadmap: string[];
    resource_needs: string;
    legal_admin: string;
  };
  financial_forecast: {
    startup_costs: { item: string; cost: number; justification: string }[];
    revenue_projections: { month_1_target: number; pricing_model: string; break_even_hours_or_units: string };
  };
  risk_management: { risk: string; mitigation: string }[];
}

export interface VentureRecommendation {
  recommended_model: string;
  viability_score: number;
  reasoning: string;
  business_model_summary: string;
  business_plan: BusinessPlan;
  pitch_deck: PitchSlide[];
  startup_budget: number;
  first_30_days_revenue_estimate: number;
  gtm_strategy: string;
  scouted_opportunities: Opportunity[];
  required_upskilling: string[];
  learning_resources: LearningResource[];
  recommended_learning_modules: string[];
}

export interface OperationalStatus {
  business_plan_generated: boolean;
  pitch_deck_generated: boolean;
  crm_configured: boolean;
  last_nudge_sent: string;
  nudge_cadence: string;
}

export interface UserProfile {
  user_id: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  skill_profile?: SkillProfile;
  venture_recommendation?: VentureRecommendation;
  operational_status?: OperationalStatus;
}
