// Simple localStorage-backed wishlist utilities
const WL_KEY = 'wishlist';

export function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem(WL_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

export function saveWishlist(list) {
  try {
    localStorage.setItem(WL_KEY, JSON.stringify(list));
  } catch (e) {
    // ignore
  }
}

export function isInWishlist(productId) {
  const list = getWishlist();
  return list.some((p) => p.id === productId);
}

export function addToWishlist(product) {
  const list = getWishlist();
  if (!list.some((p) => p.id === product.id)) {
    list.push(product);
    saveWishlist(list);
  }
}

export function removeFromWishlist(productId) {
  let list = getWishlist();
  list = list.filter((p) => p.id !== productId);
  saveWishlist(list);
}

export function toggleWishlist(product) {
  if (isInWishlist(product.id)) {
    removeFromWishlist(product.id);
    return false;
  }
  addToWishlist(product);
  return true;
}

export default { getWishlist, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist };
