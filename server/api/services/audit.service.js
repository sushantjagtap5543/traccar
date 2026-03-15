const { logAction: logToDb } = require("../../middleware/audit");

module.exports = {
  logAction: async (userId, action, details) => {
    // details contains body, params, status from the middleware
    // Mapping details to targetType and targetId if possible
    const targetType = details.body && details.body.type ? details.body.type : 'API_CALL';
    const targetId = details.params && details.params.id ? parseInt(details.params.id) : null;
    
    await logToDb(userId, action, targetType, targetId, 'system');
  }
};
