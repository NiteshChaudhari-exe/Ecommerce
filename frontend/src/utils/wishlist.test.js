import { getWishlist, saveWishlist, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist } from './wishlist';

describe('wishlist util', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('adds and retrieves items', () => {
    const p = { id: '1', name: 'Test', price: 9.99 };
    addToWishlist(p);
    const list = getWishlist();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe('1');
  });

  test('remove item', () => {
    const p = { id: '2', name: 'Foo' };
    addToWishlist(p);
    expect(isInWishlist('2')).toBe(true);
    removeFromWishlist('2');
    expect(isInWishlist('2')).toBe(false);
  });

  test('toggle wishlist', () => {
    const p = { id: '3', name: 'Bar' };
    const first = toggleWishlist(p);
    expect(first).toBe(true);
    expect(isInWishlist('3')).toBe(true);
    const second = toggleWishlist(p);
    expect(second).toBe(false);
    expect(isInWishlist('3')).toBe(false);
  });

  test('saveWishlist overwrites', () => {
    saveWishlist([{ id: 'a' }, { id: 'b' }]);
    const l = getWishlist();
    expect(l.length).toBe(2);
  });
});
