import React, { useState } from 'react';
import { FlatList, Image, StyleSheet, View, Text, TouchableOpacity } from 'react-native';

const images = [
  require('./assets/images/anarchy.png'),
  require('./assets/images/angel.png'),
  require('./assets/images/bandana.png'),
  require('./assets/images/bandeau.png'),
  require('./assets/images/bonet.png'),
  require('./assets/images/hautdeforme.png'),
  require('./assets/images/soldier.png'),
  require('./assets/images/vikinghelm.png'),
];

const shuffleArray = (array) => {
  return array.sort(() => Math.random() - 0.5);
};

const grilledejoyau = [];
for (let i = 0; i < 64; i++) {
  grilledejoyau.push(images[i % images.length]);
}

const shuffledJoyaux = shuffleArray(grilledejoyau);

export default function App() {
  const [joyaux, setJoyaux] = useState(shuffledJoyaux);
  const [selectedIndex, setSelectedIndex] = useState(null); // Nouvel état pour la case sélectionnée

  // Vérifie si deux indices sont adjacents
  const areAdjacent = (index1, index2) => {
    const row1 = Math.floor(index1 / 8);
    const col1 = index1 % 8;
    const row2 = Math.floor(index2 / 8);
    const col2 = index2 % 8;

    return (
      (row1 === row2 && Math.abs(col1 - col2) === 1) || // Même ligne, colonnes adjacentes
      (col1 === col2 && Math.abs(row1 - row2) === 1)    // Même colonne, lignes adjacentes
    );
  };

  // Au click de l'image
  const handleImageClick = (index) => {
    if (selectedIndex === null) {
      // Première sélection
      setSelectedIndex(index);
    } else {
      // Deuxième sélection
      if (areAdjacent(selectedIndex, index)) {
        // Si les cases sont adjacentes, on les échange
        const updatedJoyaux = [...joyaux];
        [updatedJoyaux[selectedIndex], updatedJoyaux[index]] = [
          updatedJoyaux[index],
          updatedJoyaux[selectedIndex],
        ];
        setJoyaux(updatedJoyaux);
      }
      // Réinitialise la sélection dans tous les cas
      setSelectedIndex(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Projet Candy Crush</Text>
      <View style={styles.gridContainer}>
        <FlatList
          data={joyaux}
          numColumns={8}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <TouchableOpacity onPress={() => handleImageClick(index)}>
              <Image

                style={[
                  styles.image,
                  selectedIndex === index && styles.selectedImage, // Highlight si sélectionné
                ]}
                source={item}
                resizeMode="center"
              />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.flatListContent}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 100,
    color: 'gray',
  },
  gridContainer: {
    width: '100%',
    alignItems: 'center',
  },
  flatListContent: {
    alignItems: 'center',
  },
  image: {
    width: 50,
    height: 50,

  },
  selectedImage: {
    borderColor: 'black',
    borderWidth: 2,
  },
});
