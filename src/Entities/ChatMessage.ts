export default {
  "name": "ChatMessage",
  "type": "object",
  "properties": {
    "user_name": {
      "type": "string"
    },
    "user_email": {
      "type": "string"
    },
    "message": {
      "type": "string"
    },
    "type": {
      "type": "string",
      "enum": [
        "chat",
        "gift",
        "system"
      ],
      "default": "chat"
    },
    "gift_type": {
      "type": "string"
    },
    "gift_amount": {
      "type": "number"
    },
    "contestant_id": {
      "type": "string"
    }
  },
  "required": [
    "user_name",
    "message"
  ]
} as const;
