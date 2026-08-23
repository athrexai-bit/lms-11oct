// Structured course data extracted from dashboard UI
// This data represents all courses available in the Athrexai platform

const COURSE_DATABASE = {
  // Generative AI Courses
  genai: {
    name: "Generative AI",
    emoji: "✨",
    subcategories: {
      llm: {
        name: "Large Language Models",
        icon: "🧠",
        courses: [
          {
            id: "genai-llm-1",
            name: "Advanced GPT Engineering",
            tag: "LLM",
            badge: "GPT",
            badgeColor: "linear-gradient(135deg, #10a37f, #1a7f64)",
            description: "Master GPT-4o, function calling, assistants API & production GPT applications.",
            duration: "5 hrs",
            rating: 4.9,
            enrolled: "20K",
            price: "₹6,000"
          },
          {
            id: "genai-llm-2",
            name: "Claude AI Engineering",
            tag: "LLM",
            badge: "Claude",
            badgeColor: "linear-gradient(135deg, #c97c3a, #e8a87c)",
            description: "Build intelligent apps using Anthropic's Claude — tool use, vision & long context.",
            duration: "4 hrs",
            rating: 4.8,
            enrolled: "12K",
            price: "₹5,500"
          },
          {
            id: "genai-llm-3",
            name: "Gemini Multimodal Engineering",
            tag: "LLM",
            badge: "Gemini",
            badgeColor: "linear-gradient(135deg, #4285f4, #34a853)",
            description: "Leverage Google Gemini for text, image, audio & video AI applications.",
            duration: "4.5 hrs",
            rating: 4.9,
            enrolled: "14K",
            price: "₹5,500"
          },
          {
            id: "genai-llm-4",
            name: "Open Source LLM Engineering",
            tag: "LLM",
            badge: "Local LLM",
            badgeColor: "linear-gradient(135deg, #374151, #6b7280)",
            description: "Run & deploy Llama, Mistral, Phi & Ollama locally and on cloud infrastructure.",
            duration: "5 hrs",
            rating: 4.8,
            enrolled: "11K",
            price: "₹5,000"
          },
          {
            id: "genai-llm-5",
            name: "LLM Fine-Tuning Engineering",
            tag: "LLM",
            badge: "Fine-Tuning",
            badgeColor: "linear-gradient(135deg, #7c3aed, #ec4899)",
            description: "Fine-tune LLMs using LoRA, QLoRA, PEFT & RLHF for domain-specific tasks.",
            duration: "6 hrs",
            rating: 4.9,
            enrolled: "9K",
            price: "₹7,000"
          },
          {
            id: "genai-llm-6",
            name: "Context Engineering for LLMs",
            tag: "LLM",
            badge: "Context",
            badgeColor: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
            description: "Design optimal context windows, memory systems & retrieval strategies for LLMs.",
            duration: "3.5 hrs",
            rating: 4.9,
            enrolled: "8K",
            price: "₹4,500"
          },
          {
            id: "genai-llm-7",
            name: "Production LLM Systems",
            tag: "LLM",
            badge: "Deployment",
            badgeColor: "linear-gradient(135deg, #f97316, #facc15)",
            description: "Deploy, monitor & scale LLMs in production with observability & cost optimization.",
            duration: "5 hrs",
            rating: 4.9,
            enrolled: "7K",
            price: "₹6,000"
          },
          {
            id: "genai-llm-8",
            name: "Foundation Model Engineering",
            tag: "LLM",
            badge: "Architecture",
            badgeType: "enterprise",
            badgeColor: "linear-gradient(135deg, #1e3a5f, #2563eb)",
            description: "Understand transformer architecture, pre-training, RLHF & foundation model design.",
            duration: "7 hrs",
            rating: 5.0,
            enrolled: "5K",
            price: "₹8,000"
          }
        ]
      },
      promptEngineering: {
        name: "Prompt Engineering",
        icon: "✍️",
        courses: [
          {
            id: "genai-pe-1",
            name: "Prompt Engineering Fundamentals",
            tag: "Prompt Engineering",
            badge: "Fundamentals",
            badgeColor: "linear-gradient(135deg, #f59e0b, #ef4444)",
            description: "Learn prompting techniques, structured outputs, reasoning patterns, and AI response optimization.",
            duration: "2 Weeks",
            rating: 4.9,
            enrolled: "18K",
            price: "₹3,500"
          },
          {
            id: "genai-pe-2",
            name: "Advanced Prompt Engineering",
            tag: "Prompt Engineering",
            badge: "Advanced",
            badgeColor: "linear-gradient(135deg, #7c3aed, #2563eb)",
            description: "Develop chain-of-thought prompts, system prompts, AI workflows, and enterprise prompt architectures.",
            duration: "3 Weeks",
            rating: 4.8,
            enrolled: "12K",
            price: "₹5,000"
          },
          {
            id: "genai-pe-3",
            name: "Prompt Engineering for Production AI",
            tag: "Prompt Engineering",
            badge: "Production",
            badgeColor: "linear-gradient(135deg, #10b981, #0ea5e9)",
            description: "Create production-grade prompt pipelines for chatbots, copilots, and AI automation platforms.",
            duration: "3 Weeks",
            rating: 4.9,
            enrolled: "10K",
            price: "₹5,500"
          }
        ]
      },
      rag: {
        name: "RAG (Retrieval-Augmented Generation)",
        icon: "🔗",
        courses: [
          {
            id: "genai-rag-1",
            name: "Build Intelligent Retrieval-Augmented AI Systems",
            tag: "RAG",
            badge: "RAG",
            badgeColor: "linear-gradient(135deg, #10b981, #0ea5e9)",
            description: "Create AI applications with embeddings, vector databases, semantic search, and enterprise knowledge retrieval.",
            duration: "3 Weeks",
            rating: 4.9,
            enrolled: "14K",
            price: "₹5,500"
          },
          {
            id: "genai-rag-2",
            name: "Knowledge Graphs & Contextual AI Retrieval",
            tag: "RAG",
            badge: "Graph RAG",
            badgeColor: "linear-gradient(135deg, #7c3aed, #ec4899)",
            description: "Develop advanced GraphRAG systems using knowledge graphs, relationship mapping, and intelligent reasoning pipelines.",
            duration: "3 Weeks",
            rating: 4.8,
            enrolled: "9K",
            price: "₹6,000"
          },
          {
            id: "genai-rag-3",
            name: "Scalable Cloud-Native RAG Architectures",
            tag: "RAG",
            badge: "Serverless RAG",
            badgeColor: "linear-gradient(135deg, #0ea5e9, #2563eb)",
            description: "Deploy serverless Retrieval-Augmented Generation systems using APIs, vector databases, and cloud functions.",
            duration: "4 Weeks",
            rating: 4.9,
            enrolled: "11K",
            price: "₹6,500"
          }
        ]
      },
      mcp: {
        name: "MCP (Model Context Protocol)",
        icon: "🔌",
        courses: [
          {
            id: "genai-mcp-1",
            name: "MCP Fundamentals",
            tag: "MCP",
            badge: "Fundamentals",
            badgeColor: "linear-gradient(135deg, #ec4899, #8b5cf6)",
            description: "Learn Model Context Protocol, tool calling, API integrations, and context-aware AI systems.",
            duration: "2 Weeks",
            rating: 4.8,
            enrolled: "8K",
            price: "₹3,500"
          },
          {
            id: "genai-mcp-2",
            name: "Enterprise MCP Engineering",
            tag: "MCP",
            badge: "Enterprise",
            badgeType: "enterprise",
            badgeColor: "linear-gradient(135deg, #1e3a5f, #2563eb)",
            description: "Develop enterprise-grade AI workflows connecting databases, APIs, CRMs, and business tools.",
            duration: "3 Weeks",
            rating: 4.8,
            enrolled: "6K",
            price: "₹6,000"
          },
          {
            id: "genai-mcp-3",
            name: "MCP & AI Agent Systems",
            tag: "MCP",
            badge: "Agent Systems",
            badgeType: "ops",
            badgeColor: "linear-gradient(135deg, #059669, #0ea5e9)",
            description: "Build autonomous AI agents capable of interacting with external systems and executing tasks.",
            duration: "3 Weeks",
            rating: 4.9,
            enrolled: "7K",
            price: "₹5,500"
          }
        ]
      },
      professional: {
        name: "Professional Programs — 3 to 6 Month Courses",
        icon: "🏅",
        isProfessional: true,
        courses: [
          {
            id: "genai-pro-1",
            name: "Professional Generative AI Engineer",
            tag: "Professional",
            badge: "Flagship",
            badgeType: "flagship",
            description: "Master LLMs, RAG, prompt engineering, fine-tuning, vector databases, and production AI applications.",
            duration: "6 Months",
            rating: 5.0,
            enrolled: "15K",
            price: "₹50,000",
            features: ["Professional Certification", "Hands-on Projects"]
          },
          {
            id: "genai-pro-2",
            name: "Full Stack Generative AI Developer",
            tag: "Professional",
            badge: "Developer",
            badgeType: "developer",
            description: "Build end-to-end GenAI applications using LLMs, APIs, RAG pipelines, and cloud deployment.",
            duration: "6 Months",
            rating: 4.9,
            enrolled: "12K",
            price: "₹45,000",
            features: ["Industry Projects", "Production Deployment"]
          },
          {
            id: "genai-pro-3",
            name: "Enterprise Generative AI Architect",
            tag: "Professional",
            badge: "Enterprise",
            badgeType: "enterprise",
            description: "Design scalable enterprise AI systems with foundation models, orchestration, and AI infrastructure.",
            duration: "6 Months",
            rating: 4.9,
            enrolled: "8K",
            price: "₹55,000",
            features: ["Enterprise Focused", "Cloud & AI Systems"]
          },
          {
            id: "genai-pro-4",
            name: "Applied Generative AI Professional",
            tag: "Professional",
            badge: "Applied",
            badgeType: "advanced",
            description: "Learn practical implementation of GPT models, embeddings, vector databases, and AI workflows.",
            duration: "3 Months",
            rating: 4.8,
            enrolled: "10K",
            price: "₹30,000",
            features: ["Real-World Use Cases", "Enterprise Integrations"]
          }
        ]
      }
    }
  },

  // Agentic AI Courses
  agentic: {
    name: "Agentic AI",
    emoji: "🤖",
    subcategories: {
      fundamentals: {
        name: "Agent Fundamentals",
        icon: "🤖",
        courses: [
          {
            id: "agentic-fund-1",
            name: "Building Autonomous AI Agents",
            tag: "All",
            description: "Create intelligent agents that can plan, reason, and execute tasks.",
            duration: "4 hrs",
            rating: 4.9,
            enrolled: "12K",
            price: "₹5,000"
          }
        ]
      },
      cloudNative: {
        name: "Cloud Native Agentic AI",
        icon: "☁️",
        courses: [
          {
            id: "agentic-cloud-1",
            name: "AWS Bedrock",
            tag: "Cloud Based",
            description: "Build Autonomous AI Agents on AWS using Bedrock foundation models.",
            duration: "5 hrs",
            rating: 4.9,
            enrolled: "10K",
            price: "₹5,000"
          },
          {
            id: "agentic-cloud-2",
            name: "Azure AutoGen",
            tag: "Cloud Based",
            description: "Create Collaborative Multi-Agent Systems using Microsoft Azure AutoGen.",
            duration: "4.5 hrs",
            rating: 4.8,
            enrolled: "8K",
            price: "₹4,500"
          },
          {
            id: "agentic-cloud-3",
            name: "Copilot Studio",
            tag: "Cloud Based",
            description: "Develop Enterprise AI Copilots with Microsoft Copilot Studio.",
            duration: "4 hrs",
            rating: 4.8,
            enrolled: "7K",
            price: "₹4,000"
          },
          {
            id: "agentic-cloud-4",
            name: "Vertex AI",
            tag: "Cloud Based",
            description: "Deploy Cloud-Native AI Agents using Google Cloud Vertex AI.",
            duration: "5 hrs",
            rating: 4.9,
            enrolled: "9K",
            price: "₹5,000"
          },
          {
            id: "agentic-cloud-5",
            name: "CrewAI",
            tag: "Cloud Based",
            description: "Engineer Multi-Agent AI Teams using the CrewAI framework.",
            duration: "4 hrs",
            rating: 4.9,
            enrolled: "6K",
            price: "₹4,500"
          },
          {
            id: "agentic-cloud-6",
            name: "n8n AI",
            tag: "Cloud Based",
            description: "Automate Workflows with AI Agents using n8n's visual automation platform.",
            duration: "3.5 hrs",
            rating: 4.8,
            enrolled: "5K",
            price: "₹4,000"
          }
        ]
      },
      professional: {
        name: "Professional Programs — 3 to 6 Month Courses",
        icon: "🏅",
        isProfessional: true,
        courses: [
          {
            id: "agentic-pro-1",
            name: "Professional Agentic AI Engineer",
            tag: "Professional",
            badge: "Flagship",
            badgeType: "flagship",
            description: "The most comprehensive program to become a certified Agentic AI Engineer.",
            duration: "6 Months",
            rating: 5.0,
            enrolled: "5K",
            price: "₹50,000"
          },
          {
            id: "agentic-pro-2",
            name: "Full Stack Generative AI Engineer",
            tag: "Professional",
            badge: "Developer",
            badgeType: "developer",
            description: "Build end-to-end GenAI applications from LLMs to production deployment.",
            duration: "5 Months",
            rating: 4.9,
            enrolled: "4.2K",
            price: "₹45,000"
          },
          {
            id: "agentic-pro-3",
            name: "Multi-Agent AI Engineering",
            tag: "Professional",
            badge: "Advanced AI",
            badgeType: "advanced",
            description: "Design, build & orchestrate complex multi-agent AI systems at scale.",
            duration: "4 Months",
            rating: 4.9,
            enrolled: "3.5K",
            price: "₹40,000"
          },
          {
            id: "agentic-pro-4",
            name: "Enterprise AI Automation Engineer",
            tag: "Professional",
            badge: "Business AI",
            badgeType: "business",
            description: "Automate enterprise workflows & processes using AI-driven solutions.",
            duration: "5 Months",
            rating: 4.8,
            enrolled: "2.8K",
            price: "₹45,000"
          },
          {
            id: "agentic-pro-5",
            name: "AI Orchestration Professional",
            tag: "Professional",
            badge: "Workflow Systems",
            badgeType: "workflow",
            description: "Master AI workflow orchestration, pipelines & agent coordination systems.",
            duration: "3 Months",
            rating: 4.9,
            enrolled: "2.2K",
            price: "₹30,000"
          },
          {
            id: "agentic-pro-6",
            name: "Autonomous AI Systems",
            tag: "Professional",
            badge: "Futuristic",
            badgeType: "futuristic",
            description: "Explore next-gen autonomous AI systems, self-learning agents & future architectures.",
            duration: "6 Months",
            rating: 5.0,
            enrolled: "1.5K",
            price: "₹55,000"
          },
          {
            id: "agentic-pro-7",
            name: "AgentOps Professional",
            tag: "Professional",
            badge: "Operations",
            badgeType: "ops",
            description: "Monitor, manage & optimize AI agents in production with AgentOps best practices.",
            duration: "3 Months",
            rating: 4.9,
            enrolled: "1.8K",
            price: "₹30,000"
          }
        ]
      },
      enterprise: {
        name: "Enterprise / Architecture Programs",
        icon: "🏗️",
        isEnterprise: true,
        courses: [
          {
            id: "agentic-ent-1",
            name: "Enterprise AI Architecture",
            tag: "Architecture",
            description: "Design scalable, secure & governed AI systems for large enterprises.",
            duration: "8 hrs",
            rating: 5.0,
            enrolled: "3K",
            price: "₹8,000"
          },
          {
            id: "agentic-ent-2",
            name: "AI Solution Architect",
            tag: "Architecture",
            description: "Master end-to-end AI solution design, integration & deployment strategies.",
            duration: "10 hrs",
            rating: 5.0,
            enrolled: "2.5K",
            price: "₹10,000"
          },
          {
            id: "agentic-ent-3",
            name: "NextGen AI Platforms",
            tag: "Architecture",
            description: "Explore cutting-edge AI platforms, toolchains & future-ready architectures.",
            duration: "7 hrs",
            rating: 4.9,
            enrolled: "1.8K",
            price: "₹7,500"
          }
        ]
      }
    }
  },

  // Data Science Courses
  datascience: {
    name: "Data Science & Analytics",
    emoji: "🔬",
    subcategories: {
      dataScience: {
        name: "Data Science",
        icon: "🔬",
        courses: [
          {
            id: "ds-1",
            name: "Data Science with Machine Learning",
            tag: "Data Science",
            description: "Master NumPy, Pandas, Scikit-learn, ML algorithms & real-world predictive modelling projects.",
            duration: "6 hrs",
            rating: 4.9,
            enrolled: "38K",
            price: "₹19,999"
          },
          {
            id: "ds-2",
            name: "Deep Learning & NLP",
            tag: "Data Science",
            description: "Build neural networks, CNNs, RNNs & NLP pipelines using TensorFlow, PyTorch and Hugging Face.",
            duration: "7 hrs",
            rating: 4.9,
            enrolled: "22K",
            price: "₹9,999"
          }
        ]
      },
      dataAnalytics: {
        name: "Data Analytics",
        icon: "📊",
        courses: [
          {
            id: "da-1",
            name: "Data Analytics & AI Tools",
            tag: "Data Analytics",
            description: "Turn raw data into business insights using Power BI & Tableau.",
            duration: "4 hrs",
            rating: 4.8,
            enrolled: "29K",
            price: "₹31,999"
          },
          {
            id: "da-2",
            name: "Advance Data Analytics",
            tag: "Data Analytics",
            description: "Write advanced SQL queries and build analytics dashboards from scratch.",
            duration: "3.5 hrs",
            rating: 4.7,
            enrolled: "17K",
            price: "₹39,999"
          },
          {
            id: "da-3",
            name: "Advance Excel",
            tag: "Data Analytics",
            description: "Master advanced Excel formulas, pivot tables, dashboards & data analysis for business insights.",
            duration: "4 hrs",
            rating: 4.8,
            enrolled: "25K",
            price: "₹9,999"
          }
        ]
      },
      aiTools: {
        name: "AI Tools for Data",
        icon: "🤖",
        courses: [
          {
            id: "ait-1",
            name: "AI Tools for Data Professionals",
            tag: "AI Tools",
            description: "Leverage ChatGPT, Copilot & AI-powered tools to supercharge your workflow.",
            duration: "3 hrs",
            rating: 4.9,
            enrolled: "21K",
            price: "₹9,999"
          }
        ]
      }
    }
  },

  // Industry AI Courses
  domainai: {
    name: "Industry AI",
    emoji: "🏭",
    subcategories: {
      healthcare: {
        name: "Healthcare",
        icon: "🏥",
        courses: [
          {
            id: "domain-health-1",
            name: "AI in Healthcare & Diagnostics",
            tag: "Healthcare",
            description: "Apply AI for medical imaging, patient data analysis & clinical decision support.",
            duration: "5 hrs",
            rating: 4.9,
            enrolled: "14K",
            price: "₹9,999"
          }
        ]
      },
      retail: {
        name: "Retail",
        icon: "🛍️",
        courses: [
          {
            id: "domain-retail-1",
            name: "AI for Retail & Inventory",
            tag: "Retail",
            description: "Demand forecasting, smart shelves & personalized shopping with AI.",
            duration: "4 hrs",
            rating: 4.8,
            enrolled: "11K",
            price: "₹9,999"
          }
        ]
      },
      ecommerce: {
        name: "E-Commerce",
        icon: "🛏️",
        courses: [
          {
            id: "domain-ecomm-1",
            name: "AI-Powered E-Commerce Solutions",
            tag: "E-Commerce",
            description: "Build recommendation engines, chatbots & dynamic pricing systems.",
            duration: "4.5 hrs",
            rating: 4.9,
            enrolled: "18K",
            price: "₹9,999"
          }
        ]
      },
      finance: {
        name: "Finance",
        icon: "💹",
        courses: [
          {
            id: "domain-fin-1",
            name: "AI in Finance & Risk Analytics",
            tag: "Finance",
            description: "Fraud detection, algorithmic trading & credit scoring using ML models.",
            duration: "5 hrs",
            rating: 4.9,
            enrolled: "16K",
            price: "₹9,999"
          }
        ]
      },
      telecom: {
        name: "Telecom",
        icon: "📶",
        courses: [
          {
            id: "domain-telecom-1",
            name: "AI for Telecom Networks",
            tag: "Telecom",
            description: "Network optimization, churn prediction & AI-driven customer experience.",
            duration: "3.5 hrs",
            rating: 4.7,
            enrolled: "8K",
            price: "₹9,999"
          }
        ]
      },
      banking: {
        name: "Banking",
        icon: "🏦",
        courses: [
          {
            id: "domain-bank-1",
            name: "AI in Banking & FinTech",
            tag: "Banking",
            description: "KYC automation, loan underwriting & conversational banking with AI.",
            duration: "4 hrs",
            rating: 4.8,
            enrolled: "12K",
            price: "₹9,999"
          }
        ]
      },
      itsupport: {
        name: "IT Support",
        icon: "🛠️",
        courses: [
          {
            id: "domain-it-1",
            name: "AI for IT Support & AIOps",
            tag: "IT Support",
            description: "Automate ticketing, root cause analysis & incident resolution with AI.",
            duration: "3 hrs",
            rating: 4.8,
            enrolled: "9K",
            price: "₹9,999"
          }
        ]
      },
      automation: {
        name: "Automation",
        icon: "⚙️",
        courses: [
          {
            id: "domain-auto-1",
            name: "Intelligent Process Automation",
            tag: "Automation",
            description: "RPA + AI for end-to-end business process automation at scale.",
            duration: "4 hrs",
            rating: 4.9,
            enrolled: "13K",
            price: "₹9,999"
          }
        ]
      },
      robotics: {
        name: "Robotics",
        icon: "🤖",
        courses: [
          {
            id: "domain-robot-1",
            name: "AI & Robotics Engineering",
            tag: "Robotics",
            description: "Build intelligent robots using computer vision, ROS & reinforcement learning.",
            duration: "6 hrs",
            rating: 4.9,
            enrolled: "7K",
            price: "₹9,999"
          }
        ]
      }
    }
  },

  // Programming Courses
  programming: {
    name: "Programming",
    emoji: "💻",
    subcategories: {
      python: {
        name: "Python",
        icon: "🐍",
        courses: [
          {
            id: "prog-1",
            name: "Python for AI & Analytics",
            tag: "Python",
            description: "Master Python programming for data analysis, automation and building AI-powered applications.",
            duration: "5 hrs",
            rating: 4.9,
            enrolled: "32K",
            price: "₹9,999"
          }
        ]
      },
      database: {
        name: "Database",
        icon: "🗄️",
        courses: [
          {
            id: "prog-2",
            name: "Database - SQL & NoSQL",
            tag: "Database",
            description: "Learn relational databases with SQL and modern NoSQL databases like MongoDB & Firebase from scratch.",
            duration: "4 hrs",
            rating: 4.8,
            enrolled: "18K",
            price: "₹9,999"
          }
        ]
      }
    }
  }
};

// Helper function to get all courses for a category
function getCoursesByCategory(categoryKey) {
  const category = COURSE_DATABASE[categoryKey];
  if (!category) return [];
  
  let allCourses = [];
  Object.values(category.subcategories).forEach(subcat => {
    subcat.courses.forEach(course => {
      allCourses.push({
        ...course,
        subcategory: subcat.name,
        subcategoryIcon: subcat.icon,
        category: category.name,
        categoryEmoji: category.emoji
      });
    });
  });
  return allCourses;
}

// Helper function to get subcategories for a category
function getSubcategories(categoryKey) {
  const category = COURSE_DATABASE[categoryKey];
  if (!category) return [];
  return Object.entries(category.subcategories).map(([key, value]) => ({
    key,
    ...value
  }));
}

// Helper function to get courses by category and subcategory
function getCoursesBySubcategory(categoryKey, subcategoryKey) {
  const category = COURSE_DATABASE[categoryKey];
  if (!category || !category.subcategories[subcategoryKey]) return [];
  return category.subcategories[subcategoryKey].courses;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { COURSE_DATABASE, getCoursesByCategory, getSubcategories, getCoursesBySubcategory };
}