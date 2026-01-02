export default {
  "name": "ShowSchedule",
  "type": "object",
  "properties": {
    "week_number": {
      "type": "number"
    },
    "season": {
      "type": "string"
    },
    "show_dates": {
      "type": "array",
      "items": {
        "type": "string",
        "format": "date"
      },
      "description": "Monday, Wednesday, Friday show dates"
    },
    "voting_closes": {
      "type": "string",
      "format": "date-time",
      "description": "Saturday end of voting"
    },
    "results_date": {
      "type": "string",
      "format": "date",
      "description": "Sunday results announcement"
    },
    "is_active": {
      "type": "boolean",
      "default": false
    },
    "eliminated_contestant_id": {
      "type": "string"
    }
  },
  "required": [
    "week_number"
  ]
} as const;
