// Common dog and cat breeds for dropdown selection
export const DOG_BREEDS = [
  'Aspin/Mongrel',
  'Beagle',
  'Bichon Frise',
  'Border Collie',
  'Boston Terrier',
  'Boxer',
  'Bulldog',
  'Cavalier King Charles Spaniel',
  'Chihuahua',
  'Chow Chow',
  'Cocker Spaniel',
  'Dachshund',
  'Dalmatian',
  'Doberman Pinscher',
  'French Bulldog',
  'German Shepherd',
  'Golden Retriever',
  'Great Dane',
  'Havanese',
  'Jack Russell Terrier',
  'Labrador Retriever',
  'Maltese',
  'Miniature Schnauzer',
  'Pekingese',
  'Pomeranian',
  'Poodle',
  'Pug',
  'Rottweiler',
  'Shih Tzu',
  'Siberian Husky',
  'Yorkshire Terrier',
  'Other'
];

export const CAT_BREEDS = [
  'American Shorthair',
  'Bengal',
  'British Shorthair',
  'Burmese',
  'Maine Coon',
  'Persian',
  'Puspin/Domestic Shorthair',
  'Ragdoll',
  'Russian Blue',
  'Scottish Fold',
  'Siamese',
  'Sphynx',
  'Other'
];

// Helper function to get breed options based on pet type
export const getBreedOptions = (petType) => {
  if (petType === 'Dog') {
    return DOG_BREEDS;
  } else if (petType === 'Cat') {
    return CAT_BREEDS;
  }
  return ['Other'];
};
