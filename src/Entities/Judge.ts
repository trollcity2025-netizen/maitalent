export default {
  "name": "Judge",
  "type": "object",
  "properties": {
    "user_email": {
      "type": "string"
    },
    "display_name": {
      "type": "string"
    },
    "avatar": {
      "type": "string"
    },
    "seat_number": {
      "type": "number",
      "enum": [
        1,
        2,
        3,
        4
      ]
    },
    "specialty": {
      "type": "string"
    },
    "is_active": {
      "type": "boolean",
      "default": true
    },
    "application_status": {
      "type": "string",
      "enum": [
        "pending",
        "approved",
        "rejected"
      ],
      "default": "pending"
    },
    "bio": {
      "type": "string"
    },
    "experience": {
      "type": "string"
    },
    "social_media": {
      "type": "object",
      "properties": {
        "twitter": {
          "type": "string"
        },
        "instagram": {
          "type": "string"
        },
        "linkedin": {
          "type": "string"
        }
      }
    }
  },
  "required": [
    "user_email",
    "display_name"
  ]
} as const;
