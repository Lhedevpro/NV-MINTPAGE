export const getItemName = (index) => {
    switch(index) {
        case 0: return 'Muscle Booster';
        case 1: return 'Reflex Enhancer';
        case 2: return 'Synaptic Amp';
        case 3: return 'Bio-Stabilizer';
        case 4: return 'Vocal Modulator';
        case 5: return 'Flux Chip';
        case 6: return 'Neural Primer';
        case 7: return 'Combat Routine';
        case 8: return 'Precision Serum';
        case 9: return 'Points';
        default: return undefined;
    }
};

export const getItemValue = (index, inventory, heroRecords) => {
    if (index === 9) return calculatePoints(heroRecords.victories);
    if (index >= 0 && index <= 8) return Number(inventory[index]);
    return 0;
};

export const calculatePoints = (victories) => {
    return victories.reduce((total, victory, index) => {
        return total + (victory * (index + 1));
    }, 0);
}; 