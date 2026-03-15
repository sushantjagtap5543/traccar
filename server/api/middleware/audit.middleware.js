const { logAction } = require("../services/audit.service");

module.exports = (req, res, next) => {
  const originalSend = res.send;

  res.send = function (body) {
    res.send = originalSend;
    
    // Log after the response is sent successfully or if it's a mutation
    if (["POST", "PUT", "DELETE"].includes(req.method) && res.statusCode < 400) {
      const userId = req.user ? req.user.id : "anonymous";
      logAction(userId, `${req.method} ${req.originalUrl}`, {
        params: req.params,
        body: req.body,
        status: res.statusCode
      }).catch(err => console.error("Audit logging failed:", err));
    }

    return res.send(body);
  };

  next();
};
