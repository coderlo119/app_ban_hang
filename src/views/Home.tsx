import React, { FC, useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import {
  ActiveChat,
  addNewActiveChats,
  getUnreadChatsCount,
} from "@store/chats";
import { useDispatch, useSelector } from "react-redux";
import size from "@utils/size";
import ChatNotification from "@Ui/ChatNotification";
import socket, { handleSocketConnection } from "src/socket";
import { runAxiosAsync } from "@api/runAxiosAsync";
import CategoryList from "@conponents/CategoryList";
import LatesProductList, { LatestProduct } from "@conponents/LatesProductList";
import SearchBar from "@conponents/SearchBar";
import SearchAddressButton from "@conponents/SearchAddressButton";
import SearchModal from "@conponents/SearchModal";
import useAuth from "@hooks/useAuth";
import useClient from "@hooks/useClient";
import { AppStackParamList } from "@navigator/AppNavigator";

interface Props {}

const Home: FC<Props> = () => {
  const [products, setProducts] = useState<LatestProduct[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const { navigate } = useNavigation<NavigationProp<AppStackParamList>>();
  const { authClient } = useClient();
  const { authState } = useAuth();
  const dispatch = useDispatch();
  const totalUnreadMessages = useSelector(getUnreadChatsCount);

  const fetchLatestProduct = async () => {
    const res = await runAxiosAsync<{ products: LatestProduct[] }>(
      authClient.get("/product/latest")
    );
    if (res?.products) {
      setProducts(res.products);
    }
  };

  const fetchLastChats = async () => {
    const res = await runAxiosAsync<{ chats: ActiveChat[] }>(
      authClient("/conversation/last-chats")
    );

    if (res) {
      dispatch(addNewActiveChats(res.chats));
    }
  };

  useEffect(() => {
    const handleApiRequest = async () => {
      await fetchLatestProduct();
      await fetchLastChats();
    };
    handleApiRequest();
  }, []);

  useEffect(() => {
    if (authState.profile) handleSocketConnection(authState.profile, dispatch);
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <>
      <ChatNotification
        onPress={() => navigate("Chats")}
        indicate={totalUnreadMessages > 0}
      />
      <ScrollView style={styles.container}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBarContainer}>
            <SearchBar asButton onPress={() => setShowSearchModal(true)} />
          </View>
          <View style={styles.searchAddressButtonContainer}>
            <SearchAddressButton
              onPress={() => {
                navigate("SearchAddress");
              }}
            />
          </View>
        </View>
        <CategoryList
          onPress={(category) => navigate("ProductList", { category })}
        />
        <LatesProductList
          data={products}
          onPress={({ id }) => navigate("SingleProduct", { id })}
        />
      </ScrollView>
      <SearchModal visible={showSearchModal} onClose={setShowSearchModal} />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: size.padding,
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  searchBarContainer: {
    flex: 8,
    marginRight: 8,
  },
  searchAddressButtonContainer: {
    flex: 1,
  },
});

export default Home;
