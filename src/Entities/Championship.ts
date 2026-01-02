export default {
  "name": "Championship",
  "type": "object",
  "properties": {
    "season": {
      "type": "string"
    },
    "top_12_contestants": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Array of contestant IDs"
    },
    "current_week": {
      "type": "number",
      "default": 1
    },
    "is_active": {
      "type": "boolean",
      "default": true
    },
    "start_date": {
      "type": "string",
      "format": "date"
    },
    "end_date": {
      "type": "string",
      "format": "date"
    },
    "winner_id": {
      "type": "string"
    },
    "runner_up_id": {
      "type": "string"
    },
    "third_place_id": {
      "type": "string"
    }
  },
  "required": [
    "season"
  ]
} as const;
