export default {
  "name": "Message",
  "type": "object",
  "properties": {
    "from_email": {
      "type": "string"
    },
    "to_email": {
      "type": "string"
    },
    "from_name": {
      "type": "string"
    },
    "to_name": {
      "type": "string"
    },
    "message": {
      "type": "string"
    },
    "is_read": {
      "type": "boolean",
      "default": false
    },
    "conversation_id": {
      "type": "string",
      "description": "ID to group messages between two users"
    }
  },
  "required": [
    "from_email",
    "to_email",
    "message"
  ]
} as const;
