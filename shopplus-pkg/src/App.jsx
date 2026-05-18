import { useState } from 'react';
import HomeScreen from './screens/Home';
import ScanScreen from './screens/Scan';
import ProductScreen from './screens/Product';
import CartScreen from './screens/Cart';
import { ConfirmScreen, HistoryScreen, SettingsScreen } from './screens/OtherScreens';
import { BottomNav } from './components';

const NAV_SCREENS = ['home', 'scan', 'cart', 'history', 'settings'];

export default function App() {
  const [screen, setScreen] = useState('home');
  const [screenStack, setScreenStack] = useState(['home']);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [currentUPC, setCurrentUPC] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [lastOrder, setLastOrder] = useState(null);

  function navigate(to) {
    setScreen(to);
    if (NAV_SCREENS.includes(to)) {
      setScreenStack([to]);
    } else {
      setScreenStack(prev => [...prev, to]);
    }
  }

  function goBack() {
    if (screenStack.length > 1) {
      const newStack = screenStack.slice(0, -1);
      setScreenStack(newStack);
      setScreen(newStack[newStack.length - 1]);
    } else {
      navigate('home');
    }
  }

  function handleProductFound(product, upc) {
    setCurrentProduct(product);
    setCurrentUPC(upc);
  }

  function handleAddToCart(item) {
    setCartItems(prev => {
      const existing = prev.findIndex(
        i => i.upc === item.upc && i.retailer === item.retailer
      );
      if (existing >= 0) {
        return prev.map((ci, idx) =>
          idx === existing ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  const navTab = NAV_SCREENS.includes(screen) ? screen
    : screen === 'product' ? 'scan'
    : screen === 'confirm' ? 'cart'
    : 'home';

  const showBottomNav = screen !== 'confirm';

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      maxWidth: 430, margin: '0 auto', position: 'relative',
    }}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {screen === 'home' && <HomeScreen onNav={navigate} cartCount={cartItems.length} />}
        {screen === 'scan' && <ScanScreen onNav={navigate} onProductFound={handleProductFound} />}
        {screen === 'product' && (
          <ProductScreen onNav={navigate} onBack={goBack} product={currentProduct} upc={currentUPC} onAddToCart={handleAddToCart} />
        )}
        {screen === 'cart' && (
          <CartScreen onNav={navigate} cartItems={cartItems} onUpdateCart={setCartItems} onOrderPlaced={order => setLastOrder(order)} />
        )}
        {screen === 'confirm' && (
          <ConfirmScreen onNav={navigate} order={lastOrder} onClearCart={() => setCartItems([])} />
        )}
        {screen === 'history' && <HistoryScreen onNav={navigate} />}
        {screen === 'settings' && <SettingsScreen onNav={navigate} />}
      </div>
      {showBottomNav && <BottomNav active={navTab} onNav={navigate} />}
    </div>
  );
}
