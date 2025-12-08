// Helper function to calculate Euclidean distance between two descriptors
const euclideanDistance = (descriptor1, descriptor2) => {
  if (!descriptor1 || !descriptor2 || descriptor1.length !== descriptor2.length) {
    return Infinity;
  }

  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

// Compare two face descriptors
// Returns true if faces match within threshold
const compareFaces = (enrolledDescriptor, capturedDescriptor, threshold = 0.6) => {
  if (!enrolledDescriptor || !capturedDescriptor) {
    return false;
  }

  const distance = euclideanDistance(enrolledDescriptor, capturedDescriptor);
  console.log(`Face distance: ${distance.toFixed(4)}, Threshold: ${threshold}`);
  
  return distance <= threshold;
};

module.exports = {
  euclideanDistance,
  compareFaces,
};