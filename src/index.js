// npm install react-native-otp-verify --save

import React, {Component} from 'react';
import {
  View,
  Button,
  Text,
  TextInput,
  Image,
  StyleSheet,
  Keyboard,
  Alert,
  Pressable,
} from 'react-native';

import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import RNOtpVerify from 'react-native-otp-verify';

const successImageUri =
  'https://cdn.pixabay.com/photo/2015/06/09/16/12/icon-803718_1280.png';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.unsubscribe = null;
    this.state = {
      user: null,
      message: '',
      otpInput: '',
      phoneNumber: '+918160626881',
      confirmResult: null,
    };
  }

  componentDidMount() {
    this.unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        console.log('userdata >>>>>>>>>>>>>>> ', user.toJSON());
        this.setState({user: user.toJSON()});
      } else {
        // User has been signed out, reset the state
        this.setState({
          user: null,
          message: '',
          otpInput: '',
          phoneNumber: '+918160626881',
          confirmResult: null,
        });
      }
    });
  }

  componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    RNOtpVerify.removeListener();
  }

  startListeningForOtp = () =>
    RNOtpVerify.getOtp()
      .then((p) => RNOtpVerify.addListener(this.otpHandler))
      .catch((p) => console.log(p));

  otpHandler = (message) => {
    Alert.alert('abcd>>>>>>>>>', message);

    if (message === 'Timeout Error.') {
      Alert.alert('Error', message);
      RNOtpVerify.removeListener();
    } else {
      console.log('message>>>>', message);
      const otp = /(\d{6})/g.exec(message)[1];
      console.log('otp>>>>', otp);
      this.setState({otpInput: otp});
      RNOtpVerify.removeListener();
    }
  };

  signIn = () => {
    this.startListeningForOtp();
    const {phoneNumber} = this.state;
    this.setState({
      message: 'Sending code ...',
    });

    firebase
      .auth()
      .signInWithPhoneNumber(phoneNumber)
      .then((confirmResult) => {
        console.log('confirmResult>>>>>>  ', JSON.stringify(confirmResult));
        this.setState({
          confirmResult,
          message: 'Code has been sent!',
        });
      })
      .catch((error) =>
        this.setState({
          message: `Sign In With Phone Number Error: ${error.message}`,
        }),
      );
  };

  confirmCode = () => {
    const {otpInput, confirmResult} = this.state;

    if (confirmResult && otpInput.length) {
      confirmResult
        .confirm(otpInput)
        .then((user) => {
          console.log(user);
          Alert.alert('Success', 'Code confirmed');
          this.setState({message: 'Code Confirmed!'});
          RNOtpVerify.removeListener();
        })
        .catch((error) => {
          console.log(error);
          Alert.alert('Error', error.toString());
          this.setState({
            message: `Code Confirm Error: ${error.message}`,
          });
          RNOtpVerify.removeListener();
        });
    }
  };

  signOut = () => {
    firebase.auth().signOut();
  };

  renderPhoneNumberInput() {
    const {phoneNumber} = this.state;

    return (
      <View style={styles.container}>
        <Text>Enter phone number:</Text>
        <TextInput
          keyboardType="phone-pad"
          autoFocus
          style={styles.phoneinput}
          onChangeText={(value) => this.setState({phoneNumber: value})}
          value={phoneNumber}
        />
        <Button title="Sign In" color="green" onPress={this.signIn} />
      </View>
    );
  }

  renderMessage() {
    if (!this.state.message.length) {
      return null;
    }
    return <Text style={styles.msg}>{this.state.message}</Text>;
  }

  renderVerificationotpInput() {
    const {user} = this.state;
    return (
      <View style={styles.container}>
        <Text>Enter verification code below:</Text>
        <TextInput
          keyboardType="phone-pad"
          style={styles.phoneinput}
          onChangeText={(value) => this.setState({otpInput: value})}
          placeholder={'Code ... '}
          value={this.state.otpInput}
        />
        <Pressable style={styles.resendBtn} onPress={() => this.signIn()}>
          <Text style={styles.resendotp}>Resend OTP</Text>
        </Pressable>

        <Pressable style={styles.resendBtn} onPress={() => this.confirmCode()}>
          <Text style={styles.resendotp}>login</Text>
        </Pressable>
      </View>
    );
  }

  render() {
    const {user, confirmResult} = this.state;
    return (
      <View style={{flex: 1}}>
        {!user && !confirmResult && this.renderPhoneNumberInput()}

        {this.renderMessage()}

        {!user && confirmResult && this.renderVerificationotpInput()}

        {user && (
          <View style={styles.container}>
            <Image source={{uri: successImageUri}} style={styles.image} />
            <Text style={{fontSize: 25}}>Signed In!</Text>
            <Text>{JSON.stringify(user)}</Text>
            <Button title="Sign Out" color="red" onPress={this.signOut} />
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    flex: 1,
    height: '100%',
    width: '100%',
    position: 'absolute',
    zIndex: -1,
  },
  image: {
    width: 100,
    height: 100,
    marginBottom: 25,
  },
  msg: {
    padding: 5,
    backgroundColor: '#000',
    color: '#fff',
  },
  phoneinput: {
    width: '80%',
    height: 40,
    marginTop: 15,
    marginBottom: 15,
    borderWidth: 1,
  },

  resendBtn: {
    marginTop: 5,
    backgroundColor: 'green',
    height: 35,
    width: 120,
    justifyContent: 'center',
    borderRadius: 50,
  },
  resendotp: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
});
