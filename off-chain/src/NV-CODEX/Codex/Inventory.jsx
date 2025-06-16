import React from 'react';
import { getItemName, getItemValue } from '../../utils/inventoryUtils';
import './Inventory.css';

const Inventory = ({ slots, heroRecords }) => (
    <div className="slots-container">
        {slots.map((slot, index) => {
            // Ignorer les cases 7 et 8
            if (index === 7 || index === 8) return null;
            
            const itemName = getItemName(index);
            if (itemName === undefined) return null;
            
            return (
                <div key={index} className="slot-wrapper">
                    <div className="slot-title">
                        {itemName}
                    </div>
                    <div className="slot-item">
                        <div className="slot-content">
                            <span className="slot-count">{getItemValue(index, slots, heroRecords)}</span>
                        </div>
                    </div>
                </div>
            );
        })}
    </div>
);

export default Inventory; 