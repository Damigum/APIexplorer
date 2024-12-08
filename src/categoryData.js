export const groupedCategories = {
  "Technology & Development": {
    color: "var(--category-technology)",
    subcategories: [
      "Programming",
      "Development",
      "Machine Learning",
      "Continuous Integration",
      "Cloud Storage & File Sharing",
      "Data Validation",
      "Anti-Malware",
      "Security",
      "Open Source Projects"
    ]
  },
  "Business & Finance": {
    color: "var(--category-business)",
    subcategories: [
      "Business",
      "Finance",
      "Cryptocurrency",
      "Currency Exchange",
      "Jobs",
      "Shopping"
    ]
  },
  "Government & Society": {
    color: "var(--category-government)",
    subcategories: [
      "Government",
      "Open Data",
      "Patent",
      "Fraud Prevention",
      "Environment"
    ]
  },
  "Entertainment & Media": {
    color: "var(--category-entertainment)",
    subcategories: [
      "Entertainment",
      "Music",
      "Video",
      "Games & Comics",
      "Anime",
      "Books",
      "News"
    ]
  },
  "Lifestyle & Health": {
    color: "var(--category-lifestyle)",
    subcategories: [
      "Health",
      "Food & Drink",
      "Sports & Fitness",
      "Events",
      "Calendar"
    ]
  },
  "Education & Knowledge": {
    color: "var(--category-education)",
    subcategories: [
      "Education",
      "Science & Math",
      "Dictionaries",
      "Text Analysis"
    ]
  },
  "Arts & Culture": {
    color: "var(--category-arts)",
    subcategories: [
      "Art & Design",
      "Photography"
    ]
  },
  "Transportation & Location": {
    color: "var(--category-transportation)",
    subcategories: [
      "Transportation",
      "Vehicle",
      "Geocoding"
    ]
  },
  "Nature & Animals": {
    color: "var(--category-nature)",
    subcategories: [
      "Animals",
      "Weather"
    ]
  },
  "Utilities & Tools": {
    color: "var(--category-utilities)",
    subcategories: [
      "Documents & Productivity",
      "URL Shorteners",
      "Test Data",
      "Tracking",
      "Email"
    ]
  },
  "Social & Personal": {
    color: "var(--category-social)",
    subcategories: [
      "Social",
      "Personality"
    ]
  }
};

export const getCategoryColor = (category) => {
  for (const [groupName, { color, subcategories }] of Object.entries(groupedCategories)) {
    if (subcategories.includes(category)) {
      if (typeof window !== 'undefined' && window.getComputedStyle) {
        const style = getComputedStyle(document.documentElement);
        const varName = color.match(/var\((.*?)\)/)?.[1];
        if (varName) {
          return style.getPropertyValue(varName).trim() || color;
        }
      }
      return color;
    }
  }
  return "#000000";
};
