import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-community/async-storage';
import { View, Text, SafeAreaView, Image, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

import api from '../services/api';

import logo from '../assets/logo.png';
import like from '../assets/like.png';
import dislike from '../assets/dislike.png';
import itsamatch from '../assets/itsamatch.png';

const SCREEN_WIDTH = Dimensions.get('window').width;
const rotationX = SCREEN_WIDTH * 2;

export default function Main({ navigation }) {
  const id = navigation.getParam('user');
  const [users, setUsers] = useState([]);
  const [matchDev, setMatchDev] = useState(null);
  const pan = new Animated.ValueXY(0);

  useEffect(() => {
    async function loadUsers() {
      const response = await api.get('/devs', {
        headers: {
          user: id,
        }
      })

      setUsers(response.data);
    }

    loadUsers();
  }, [id]);

  useEffect(() => {
    const socket = io('http://localhost:3333', {
      query: { user: id }
    });

    socket.on('match', dev => {
      setMatchDev(dev);
    })
  }, [id]);

  function swipeEffect(direction, func) {
    let x = 0;
    let y = 0;

    if(direction === 'right') {
      x = 1000;
    } else if (direction === 'left') {
      x = -1000;
    } else if (direction === 'top') {
      y = -1000;
    }

    Animated.timing(pan, {
      toValue: { x, y },
      duration: 180,
      useNativeDriver: true,
    }).start();

    if(func) {
      func();
    }

  }

  async function handleSuperLike() {
    const [user, ...rest] = users;

    swipeEffect('top');

    await api.post(`/devs/${user._id}/likes`, null, {
      headers: { user: id },
    })

    setUsers(rest);
  }

  async function handleLike() {
    const [user, ...rest] = users;

    swipeEffect('right');

    await api.post(`/devs/${user._id}/likes`, null, {
      headers: { user: id },
    })

    setUsers(rest);
  }

  async function handleDislike() {
    const [user, ...rest] = users;

    swipeEffect('left');

    await api.post(`/devs/${user._id}/dislikes`, null, {
      headers: { user: id },
    })

    setUsers(rest);
  }

  async function handleLogout() {
    await AsyncStorage.clear();

    navigation.navigate('Login');
  }

  function resetPosition() {
    Animated.timing(pan, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }

  const onGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: pan.x,
          translationY: pan.y,
        },
      },
    ],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = event => {
    if (event.nativeEvent.oldState === State.ACTIVE) {

      if(event.nativeEvent.translationX > 80) {
        return swipeEffect('right', handleLike);
      }

      if(event.nativeEvent.translationX < -80) {
        return swipeEffect('left', handleDislike);
      }

      if(event.nativeEvent.translationY < -80) {
        return swipeEffect('top', handleSuperLike);
      }

      resetPosition();
    }
  };

  const rotate = pan.x.interpolate({
    inputRange: [-rotationX, 0, rotationX],
    outputRange: ['-120deg', '0deg', '120deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={handleLogout}>
        <Image style={styles.logo} source={logo} />
      </TouchableOpacity>

      <View style={styles.cardsContainer}>
        { users.length === 0
          ? <Text style={styles.empty}>Acabou :(</Text>
          : (
            users.map((user, index) => (
              <PanGestureHandler
                key={user._id}
                onGestureEvent={onGestureEvent}
                onHandlerStateChange={onHandlerStateChange}
              >
                <Animated.View style={[styles.card, { zIndex: users.length - index, transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] }]}>
                  <Image style={styles.avatar} source={{ uri: user.avatar }} />
                  <View style={styles.footer}>
                    <Text style={styles.name}>{user.name}</Text>
                    <Text style={styles.bio} numberOfLines={3}>{user.bio}</Text>
                  </View>
                </Animated.View>
              </PanGestureHandler>
            ))
          )}
      </View>

      { users.length > 0 && (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.button} onPress={handleDislike}>
            <Image source={dislike} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleLike}>
            <Image source={like} />
          </TouchableOpacity>
        </View>
      ) }

      { matchDev && (
        <View style={styles.matchContainer}>
          <Image style={styles.matchImage} source={itsamatch} />
          <Image style={styles.matchAvatar} source={{ uri: matchDev.avatar }} />

          <Text style={styles.matchName}>{matchDev.name}</Text>
          <Text style={styles.matchBio}>{matchDev.bio}</Text>

          <TouchableOpacity onPress={() => setMatchDev(null)}>
            <Text style={styles.closeMatch}>FECHAR</Text>
          </TouchableOpacity>
        </View>
      ) }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'space-between'
  },

  logo: {
    marginTop: 30,
  },

  empty: {
    alignSelf: 'center',
    color: '#999',
    fontSize: 24,
    fontWeight: 'bold'
  },

  cardsContainer: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    maxHeight: 500,
  },

  card: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    margin: 30,
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  avatar: {
    flex: 1,
    height: 300,
  },

  footer: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },

  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },

  bio: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    lineHeight: 18
  },

  buttonsContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    zIndex: 1,
  },

  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  matchContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },

  matchImage: {
    height: 60,
    resizeMode: 'contain'
  },

  matchAvatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 5,
    borderColor: '#FFF',
    marginVertical: 30,
  },

  matchName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF'
  },

  matchBio: {
    marginTop: 10,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 30
  },

  closeMatch: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 30,
    fontWeight: 'bold'
  },
});