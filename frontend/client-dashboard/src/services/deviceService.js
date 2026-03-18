import API from "./api";

export const getDevices = async () => {
  const res = await API.get("/devices");
  return res.data;
};

export const getPositions = async () => {
  const res = await API.get("/positions");
  return res.data;
};

export const addDevice = async (device) => {
  const res = await API.post("/devices/register", device);
  return res.data;
};

export const updateDevice = async (id, device) => {
  const res = await API.put(`/devices/${id}`, device);
  return res.data;
};

export const deleteDevice = async (id) => {
  const res = await API.delete(`/devices/${id}`);
  return res.data;
};

export const sendCommand = async (deviceId, type) => {
  const res = await API.post(`/commands/${deviceId}/ignition`, { state: type === 'engineResume' });
  return res.data;
};
