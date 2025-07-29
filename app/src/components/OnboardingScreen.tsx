import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Swiper from 'react-native-swiper';

const { width, height } = Dimensions.get("window");

const OnboardingScreen = ({ onComplete }: any) => {
    const handleGetStarted = async () => {
        try {
            await AsyncStorage.setItem('hasOnboarded', 'true');
            onComplete(true);
        } catch (error) {
            console.error('Error saving onboarding status:', error);
        }
    };
    return (
        <View style={styles.container}>
            <Swiper loop={false} showsPagination dotStyle={styles.dot} activeDotStyle={styles.activeDot}>
                {slides.map(({ image, title, subtitle }, index) => (
                    <View key={index} style={styles.slide}>
                        <Image source={image} style={styles.image} />
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.subtitle}>{subtitle}</Text>
                        {index === slides.length - 1 && (
                            <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
                                <Text style={styles.buttonText}>Get Started</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
            </Swiper>
        </View>
    );
};

const slides = [
    {
        image: require("../assets/images/education1.png"),
        title: "Welcome to ADG Classes",
        subtitle: "Enhance your learning with interactive quizzes and courses.",
    },
    {
        image: require("../assets/images/education2.png"),
        title: "Track Your Progress",
        subtitle: "Monitor your learning journey and improve every day.",
    },
    {
        image: require("../assets/images/education3.png"),
        title: "Learn at Your Pace",
        subtitle: "Study anytime, anywhere with our flexible courses.",
    },
];

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    slide: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    image: {
        width: width * 0.8,
        height: height * 0.4,
        resizeMode: "contain",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#333",
        marginTop: 20,
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginTop: 10,
        paddingHorizontal: 10,
    },
    button: {
        backgroundColor: "#007bff",
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        marginTop: 20,
    },
    buttonText: {
        fontSize: 18,
        color: "#fff",
        fontWeight: "bold",
    },
    dot: {
        backgroundColor: "#ccc",
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: "#007bff",
        width: 10,
        height: 10,
        borderRadius: 5,
    },
});

export default OnboardingScreen;
