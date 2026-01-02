export default {
  "name": "Contestant",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Contestant's stage name"
    },
    "email": {
      "type": "string"
    },
    "talent_type": {
      "type": "string",
      "enum": [
        "singing",
        "dancing",
        "comedy",
        "magic",
        "instrumental",
        "acrobatics",
        "other"
      ]
    },
    "description": {
      "type": "string",
      "description": "Description of their talent"
    },
    "video_url": {
      "type": "string",
      "description": "Audition video URL"
    },
    "profile_image": {
      "type": "string"
    },
    "status": {
      "type": "string",
      "enum": [
        "pending",
        "approved",
        "rejected",
        "live",
        "performed",
        "eliminated",
        "champion"
      ],
      "default": "pending"
    },
    "votes": {
      "type": "number",
      "default": 0
    },
    "weekly_votes": {
      "type": "number",
      "default": 0,
      "description": "Votes for current week"
    },
    "gifts_received": {
      "type": "number",
      "default": 0
    },
    "total_score": {
      "type": "number",
      "default": 0
    },
    "judge_scores": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "judge_id": {
            "type": "string"
          },
          "score": {
            "type": "number"
          }
        }
      }
    },
    "performance_start": {
      "type": "string",
      "format": "date-time"
    },
    "championship_position": {
      "type": "number",
      "description": "Position in championship (1-12)"
    },
    "elimination_risk": {
      "type": "boolean",
      "default": false,
      "description": "At risk of elimination this week"
    },
    "follower_count": {
      "type": "number",
      "default": 0
    },
    "payout_info": {
      "type": "object",
      "properties": {
        "method": {
          "type": "string",
          "enum": [
            "paypal",
            "gift_card"
          ]
        },
        "paypal_email": {
          "type": "string"
        },
        "gift_card_type": {
          "type": "string"
        }
      }
    },
    "total_earnings": {
      "type": "number",
      "default": 0
    }
  },
  "required": [
    "name",
    "email",
    "talent_type",
    "description"
  ]
} as const;
