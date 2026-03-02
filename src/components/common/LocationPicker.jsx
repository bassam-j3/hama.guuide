import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, LayersControl } from 'react-leaflet'; 
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { GeoAltFill, Map as MapIcon } from 'react-bootstrap-icons';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const LocationMarker = ({ position, setPosition, setAddress }) => {
    const map = useMapEvents({
        click: async (e) => {
            const { lat, lng } = e.latlng;
            setPosition({ lat, lng });
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                const data = await response.json();
                setAddress(data.display_name || "Address not found");
            } catch (error) { setAddress("Coordinates selected"); }
        },
    });
    useEffect(() => { if (position) map.flyTo(position, map.getZoom()); }, [position, map]);
    return position === null ? null : <Marker position={position}><Popup>الموقع المحدد</Popup></Marker>;
};

const LocationPicker = ({ onLocationSelect, initialLat, initialLng }) => {
    const [show, setShow] = useState(false);
    const [position, setPosition] = useState(null);
    const [address, setAddress] = useState("");

    useEffect(() => {
        if (initialLat && initialLng && !isNaN(initialLat) && !isNaN(initialLng)) {
            if (parseFloat(initialLat) !== 0 || parseFloat(initialLng) !== 0) setPosition({ lat: parseFloat(initialLat), lng: parseFloat(initialLng) });
        }
    }, [initialLat, initialLng]);

    const handleConfirm = () => { if (position) { onLocationSelect(position.lat, position.lng, address); setShow(false); } };

    return (
        <>
            <button type="button" className="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center gap-2 w-100 w-md-auto" onClick={() => setShow(true)}>
                <MapIcon /> {position ? "تغيير الموقع" : "تحديد على الخريطة"}
            </button>

            {/* 🚀 متجاوب: modal-fullscreen-md-down يجعله ملء الشاشة في الجوال فقط */}
            <Modal show={show} onHide={() => setShow(false)} size="lg" centered className="modal-fullscreen-md-down">
                <Modal.Header closeButton><Modal.Title className="fs-6 fw-bold">اختر الموقع</Modal.Title></Modal.Header>
                <Modal.Body className="p-0 d-flex flex-column">
                    {/* 🚀 متجاوب: ارتفاع الخريطة نسبة من الشاشة لتناسب الجوالات */}
                    <div style={{ height: "60vh", minHeight:"300px", width: "100%", position: 'relative' }}>
                        <MapContainer center={position || [35.1318, 36.7578]} zoom={14} style={{ height: "100%", width: "100%", zIndex: 1 }}>
                            <LayersControl position="topright">
                                <LayersControl.BaseLayer checked name="Clean View">
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                </LayersControl.BaseLayer>
                                <LayersControl.BaseLayer name="Satellite">
                                    <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                                </LayersControl.BaseLayer>
                            </LayersControl>
                            <LocationMarker position={position} setPosition={setPosition} setAddress={setAddress} />
                        </MapContainer>
                    </div>
                    {address && (
                        <div className="p-3 bg-light border-top flex-shrink-0">
                            <small className="text-muted d-block fw-bold mb-1" style={{fontSize:'0.7rem'}}>الموقع:</small>
                            <span className="text-dark small lh-sm d-block">{address}</span>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="p-2 p-md-3">
                    <Button variant="light" className="flex-grow-1 flex-md-grow-0" onClick={() => setShow(false)}>إلغاء</Button>
                    <Button variant="primary" className="flex-grow-1 flex-md-grow-0 fw-bold" onClick={handleConfirm} disabled={!position}>تأكيد الموقع</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};
export default LocationPicker;