function isDelivered(dispatch) {
  return dispatch?.status === 'delivered';
}

module.exports = { isDelivered };
