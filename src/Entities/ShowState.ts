export default {
  "name": "ShowState",
  "type": "object",
  "properties": {
    "is_live": {
      "type": "boolean",
      "default": false
    },
    "current_contestant_id": {
      "type": "string"
    },
    "show_title": {
      "type": "string"
    },
    "curtains_open": {
      "type": "boolean",
      "default": false
    },
    "performance_end_time": {
      "type": "string",
      "format": "date-time"
    },
    "viewer_count": {
      "type": "number",
      "default": 0
    }
  },
  "required": []
} as const;
