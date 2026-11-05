// Wi-Fi a bordo (conductor): enseña el QR en el teléfono a los pasajeros.
import { Link } from 'react-router-dom';
import { useStore } from '../store/AppStore.jsx';
import WifiCard from '../components/WifiCard.jsx';
import { Card } from '../components/ui.jsx';
import { useToast } from '../components/Toast.jsx';

export default function WifiPage() {
  const { config } = useStore();
  const [toast, showToast] = useToast();
  return (
    <>
      <h1 className="font-titulo text-2xl">Wi-Fi a bordo</h1>
      {config.wifi.ssid ? (
        <WifiCard wifi={config.wifi} onToast={showToast} startWithQr />
      ) : (
        <Card className="text-sm text-gris">Agrega el nombre y la contraseña de tu red en <Link to="/app/pagina#wifi" className="text-cobrado underline">Ajustes → Wi-Fi</Link>.</Card>
      )}
      {toast}
    </>
  );
}
