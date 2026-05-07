import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Donor } from '@/src/types';
import { geocodeLocation } from '@/src/lib/utils';

// Use standard Leaflet marker icon URLs
const markerIcon2x = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png';
const markerIcon = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png';
const markerShadow = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface DonorMapProps {
  donors: Donor[];
  selectedDistrict?: string;
  selectedThana?: string;
}

// Component to handle map view changes
const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// Approximate coordinates for Bangladesh locations
const LOCATION_DATA: Record<string, { center: [number, number], thanas?: Record<string, [number, number]> }> = {
  'Dhaka': {
    center: [23.8103, 90.4125],
    thanas: {
      'Dhanmondi': [23.7461, 90.3742],
      'Gulshan': [23.7925, 90.4078],
      'Uttara': [23.8759, 90.3795],
      'Mirpur': [23.8223, 90.3654],
      'Banani': [23.7940, 90.4043],
      'Mohammadpur': [23.7658, 90.3583],
      'Badda': [23.7805, 90.4267],
    }
  },
  'Satkhira': {
    center: [22.7185, 89.0706],
    thanas: {
      'Debhata': [22.5667, 88.9667],
      'Satkhira Sadar': [22.7185, 89.0706],
      'Assasuni': [22.5500, 89.1667],
      'Kalaroa': [22.8750, 89.0417],
      'Kaliganj': [22.4500, 89.0417],
      'Shyamnagar': [22.3306, 89.1028],
      'Tala': [22.7500, 89.2500]
    }
  },
  'Chattogram': {
    center: [22.3569, 91.7832],
    thanas: {
      'Panchlaish': [22.3667, 91.8333],
      'Halishahar': [22.3167, 91.7833],
      'Bakalia': [22.3333, 91.8500],
      'Kotwali': [22.3333, 91.8333],
    }
  },
  'Sylhet': {
    center: [24.8949, 91.8687],
    thanas: {
      'Sylhet Sadar': [24.8949, 91.8687],
      'Beanibazar': [24.8250, 92.1625],
      'Golapganj': [24.8583, 91.9750],
    }
  },
  'Rajshahi': { center: [24.3745, 88.6042] },
  'Khulna': { center: [22.8456, 89.5403] },
  'Barishal': { center: [22.7010, 90.3535] },
  'Rangpur': { center: [25.7439, 89.2752] },
  'Mymensingh': { center: [24.7471, 90.4203] },
  'Gazipur': { center: [24.0023, 90.4264] },
  'Narayanganj': { center: [23.6238, 90.5000] },
  'Comilla': { center: [23.4607, 91.1809] },
  'Bogra': { center: [24.8481, 89.3730] },
  'Jashore': { center: [23.1664, 89.2081] },
  'Cox\'s Bazar': { center: [21.4272, 92.0058] },
};

import { useLanguage } from '@/src/contexts/LanguageContext';

export const DonorMap: React.FC<DonorMapProps> = ({ donors, selectedDistrict, selectedThana }) => {
  const { t } = useLanguage();
  const [mapConfig, setMapConfig] = React.useState<{ center: [number, number], zoom: number }>({
    center: [23.6850, 90.3563],
    zoom: 7
  });

  React.useEffect(() => {
    const updateCenter = async () => {
      if (selectedThana && selectedDistrict) {
        const districtData = LOCATION_DATA[selectedDistrict];
        const thanaCoords = districtData?.thanas?.[selectedThana];
        
        if (thanaCoords) {
          setMapConfig({ center: thanaCoords, zoom: 13 });
        } else {
          // Try geocoding
          const coords = await geocodeLocation(selectedThana, selectedDistrict);
          if (coords) {
            setMapConfig({ center: [coords.lat, coords.lon], zoom: 13 });
          } else if (districtData?.center) {
            setMapConfig({ center: districtData.center, zoom: 13 });
          } else {
            setMapConfig({ center: [23.6850, 90.3563], zoom: 7 });
          }
        }
      } else if (selectedDistrict) {
        const districtData = LOCATION_DATA[selectedDistrict];
        if (districtData?.center) {
          setMapConfig({ center: districtData.center, zoom: 10 });
        } else {
          // Try geocoding district only
          const coords = await geocodeLocation('', selectedDistrict);
          if (coords) {
            setMapConfig({ center: [coords.lat, coords.lon], zoom: 10 });
          } else {
            setMapConfig({ center: [23.6850, 90.3563], zoom: 7 });
          }
        }
      } else {
        setMapConfig({ center: [23.6850, 90.3563], zoom: 7 });
      }
    };

    updateCenter();
  }, [selectedDistrict, selectedThana]);

  const groupedDonors = React.useMemo(() => {
    const groups: Record<string, { 
      district: string; 
      thana: string; 
      count: number; 
      bloodTypes: Record<string, number>;
      position: [number, number];
    }> = {};

    donors.forEach(donor => {
      let lat: number;
      let lon: number;
      
      if (donor.latitude && donor.longitude) {
        lat = donor.latitude;
        lon = donor.longitude;
      } else {
        const districtData = LOCATION_DATA[donor.district];
        const baseCoords = districtData?.thanas?.[donor.thana] || districtData?.center || [23.6850, 90.3563];
        lat = baseCoords[0];
        lon = baseCoords[1];
      }

      // Group by coordinates rounded to 4 decimal places (~11m precision)
      const key = `${lat.toFixed(4)}-${lon.toFixed(4)}`;
      
      if (!groups[key]) {
        groups[key] = {
          district: donor.district,
          thana: donor.thana,
          count: 0,
          bloodTypes: {},
          position: [lat, lon]
        };
      }
      
      groups[key].count++;
      groups[key].bloodTypes[donor.blood_type] = (groups[key].bloodTypes[donor.blood_type] || 0) + 1;
    });

    return Object.values(groups);
  }, [donors]);

  return (
    <div className="h-[400px] md:h-[500px] w-full rounded-2xl overflow-hidden shadow-sm border border-surface-container-low">
      <MapContainer 
        center={mapConfig.center} 
        zoom={mapConfig.zoom} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <ChangeView center={mapConfig.center} zoom={mapConfig.zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {groupedDonors.map((group) => (
          <Marker key={`${group.position[0]}-${group.position[1]}`} position={group.position}>
            <Popup>
              <div className="p-3 min-w-[180px] space-y-3">
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-primary">{t('donors.map.location')}</div>
                  <div className="text-sm font-black text-on-surface leading-none">
                    {group.thana}, {group.district}
                  </div>
                </div>
                
                <div className="bg-surface-container-low p-3 rounded-2xl border border-surface-container-high flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                    {group.count}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-70">
                      {t('donors.map.available_donors')}
                    </div>
                    <div className="text-xs font-bold text-on-surface">{t('donors.map.in_this_location')}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">{t('donors.map.blood_type_summary')}</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(group.bloodTypes).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between bg-white px-2 py-1.5 rounded-lg border border-surface-container-high shadow-sm">
                        <span className="text-[10px] font-black text-primary">{type}</span>
                        <span className="text-[10px] font-bold text-on-surface-variant">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
