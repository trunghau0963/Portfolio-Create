// Client-side API service

// Section types
export interface Section {
  _id?: string
  id: string
  title: string
  type: string
  visible: boolean
  order: number
  background?: string
}

// Project types
export interface Project {
  _id?: string
  title: string
  description: string
  imageUrl?: string
  link?: string
  github?: string
  technologies: string[]
  categories: string[]
  featured: boolean
  order: number
}

// Experience types
export interface Experience {
  _id?: string
  title: string
  company: string
  period: string
  description: string
  technologies: string[]
  detailImages: string[]
  order: number
}

// Education types
export interface Education {
  _id?: string
  institution: string
  degree: string
  field: string
  period: string
  description: string
  imageUrl?: string
  order: number
}

// Skill types
export interface Skill {
  _id?: string
  name: string
  level: number
  category: string
  imageUrl?: string
  order: number
}

// Category types
export interface Category {
  _id?: string
  name: string
  order: number
}

// Settings types
export interface Settings {
  _id?: string
  theme: string
  showPortrait: boolean
  resumeUrl: string
}

// Paragraph types
export interface Paragraph {
  _id?: string
  sectionId: string
  content: string
  type: string
  style: {
    fontSize?: string
    fontWeight?: string
    fontStyle?: string
    textAlign?: string
  }
  order: number
}

// API error type
export interface ApiError {
  message: string
  status: number
}

class ApiService {
  // Generic fetch method with error handling
  private async fetchApi<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "API request failed")
      }

      return await response.json()
    } catch (error) {
      console.error("API request error:", error)
      throw error
    }
  }

  // Sections
  async getSections(): Promise<Section[]> {
    return this.fetchApi<Section[]>("/api/sections")
  }

  async saveSection(section: Section): Promise<Section> {
    return this.fetchApi<Section>("/api/sections", {
      method: section._id ? "PUT" : "POST",
      body: JSON.stringify(section),
    })
  }

  async deleteSection(id: string): Promise<{ success: boolean }> {
    return this.fetchApi<{ success: boolean }>(`/api/sections/${id}`, {
      method: "DELETE",
    })
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return this.fetchApi<Project[]>("/api/projects")
  }

  async saveProject(project: Project): Promise<Project> {
    return this.fetchApi<Project>("/api/projects", {
      method: project._id ? "PUT" : "POST",
      body: JSON.stringify(project),
    })
  }

  async deleteProject(id: string): Promise<{ success: boolean }> {
    return this.fetchApi<{ success: boolean }>(`/api/projects/${id}`, {
      method: "DELETE",
    })
  }

  // Experiences
  async getExperiences(): Promise<Experience[]> {
    return this.fetchApi<Experience[]>("/api/experiences")
  }

  async saveExperience(experience: Experience): Promise<Experience> {
    return this.fetchApi<Experience>("/api/experiences", {
      method: experience._id ? "PUT" : "POST",
      body: JSON.stringify(experience),
    })
  }

  async deleteExperience(id: string): Promise<{ success: boolean }> {
    return this.fetchApi<{ success: boolean }>(`/api/experiences/${id}`, {
      method: "DELETE",
    })
  }

  // Education
  async getEducation(): Promise<Education[]> {
    return this.fetchApi<Education[]>("/api/education")
  }

  async saveEducation(education: Education): Promise<Education> {
    return this.fetchApi<Education>("/api/education", {
      method: education._id ? "PUT" : "POST",
      body: JSON.stringify(education),
    })
  }

  async deleteEducation(id: string): Promise<{ success: boolean }> {
    return this.fetchApi<{ success: boolean }>(`/api/education/${id}`, {
      method: "DELETE",
    })
  }

  // Skills
  async getSkills(): Promise<Skill[]> {
    return this.fetchApi<Skill[]>("/api/skills")
  }

  async saveSkill(skill: Skill): Promise<Skill> {
    return this.fetchApi<Skill>("/api/skills", {
      method: skill._id ? "PUT" : "POST",
      body: JSON.stringify(skill),
    })
  }

  async deleteSkill(id: string): Promise<{ success: boolean }> {
    return this.fetchApi<{ success: boolean }>(`/api/skills/${id}`, {
      method: "DELETE",
    })
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return this.fetchApi<Category[]>("/api/categories")
  }

  async saveCategory(category: Category): Promise<Category> {
    return this.fetchApi<Category>("/api/categories", {
      method: category._id ? "PUT" : "POST",
      body: JSON.stringify(category),
    })
  }

  async deleteCategory(id: string): Promise<{ success: boolean }> {
    return this.fetchApi<{ success: boolean }>(`/api/categories/${id}`, {
      method: "DELETE",
    })
  }

  // Settings
  async getSettings(): Promise<Settings> {
    return this.fetchApi<Settings>("/api/settings")
  }

  async saveSettings(settings: Settings): Promise<Settings> {
    return this.fetchApi<Settings>("/api/settings", {
      method: settings._id ? "PUT" : "POST",
      body: JSON.stringify(settings),
    })
  }

  // Paragraphs
  async getParagraphs(sectionId: string): Promise<Paragraph[]> {
    return this.fetchApi<Paragraph[]>(`/api/paragraphs?sectionId=${sectionId}`)
  }

  async saveParagraph(paragraph: Paragraph): Promise<Paragraph> {
    return this.fetchApi<Paragraph>("/api/paragraphs", {
      method: paragraph._id ? "PUT" : "POST",
      body: JSON.stringify(paragraph),
    })
  }

  async deleteParagraph(id: string): Promise<{ success: boolean }> {
    return this.fetchApi<{ success: boolean }>(`/api/paragraphs/${id}`, {
      method: "DELETE",
    })
  }
}

// Export a singleton instance
export const apiService = new ApiService()
