export const groupedCategories = {
  "Technology & Development": {
    color: "#F3A712",
    subcategories: [
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
    color: "#FF8C42",
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
    color: "#FF674D",
    subcategories: [
      "Government",
      "Open Data",
      "Patent",
      "Fraud Prevention",
      "Disasters",
      "Environment"
    ]
  },
  "Entertainment & Media": {
    color: "#FF6B6B",
    subcategories: [
      "Music",
      "Video",
      "Games & Comics",
      "Anime",
      "Books",
      "News"
    ]
  },
  "Lifestyle & Health": {
    color: "#66D7D1",
    subcategories: [
      "Health",
      "Food & Drink",
      "Sports & Fitness",
      "Events",
      "Calendar"
    ]
  },
  "Education & Knowledge": {
    color: "#B7C3F3",
    subcategories: [
      "Education",
      "Science & Math",
      "Dictionaries",
      "Text Analysis"
    ]
  },
  "Arts & Culture": {
    color: "#45B7D1",
    subcategories: [
      "Art & Design",
      "Photography"
    ]
  },
  "Transportation & Location": {
    color: "#0EBE78",
    subcategories: [
      "Transportation",
      "Vehicle",
      "Geocoding"
    ]
  },
  "Nature & Animals": {
    color: "#90BE6D",
    subcategories: [
      "Animals",
      "Weather"
    ]
  },
  "Utilities & Tools": {
    color: "#F8961E",
    subcategories: [
      "Documents & Productivity",
      "URL Shorteners",
      "Test Data",
      "Tracking"
    ]
  },
  "Social & Personal": {
    color: "#577590",
    subcategories: [
      "Social",
      "Personality"
    ]
  }
};

//const color = "#F4FFFD"

export const getCategoryColor = (category) => {
  for (const { color, subcategories } of Object.values(groupedCategories)) {
    if (subcategories.includes(category)) {
      return color;
    }
  }
  return "#000000"; // Default color if category is not found
};