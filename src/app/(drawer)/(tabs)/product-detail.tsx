import { useApiQuery, queryKeys } from "@/api";
import LoadingScreen from "@/components/LoadingScreen";
import { useGlobalStyles } from "@/styles/global";
import { buildImageUrl } from "@/utils/imageUrl";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

const { width } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plate, gs } = useGlobalStyles();
  const { t, i18n } = useTranslation();
  const [imgPage, setImgPage] = useState(0);

  const { data, isLoading } = useApiQuery<any>({
    url: `products/${id}`,
    queryKey: queryKeys.products.detail(id!),
    enabled: !!id,
  });

  const product = (data as any)?.data;
  if (isLoading) return <LoadingScreen />;
  if (!product) return <LoadingScreen />;

  const images = product.images ?? [];
  const isAr = i18n.language === "ar";
  const name = product.nameAr ?? product.nameEn ?? product.name ?? "";
  const desc = product.descriptionAr ?? product.descriptionEn ?? product.description ?? "";

  const notes = product.notesEn ?? product.notes ?? [];
  const colorEntry = (notes as string[]).find((n: string) => n.startsWith("colors:"));
  const colors = colorEntry ? colorEntry.replace("colors:", "").split(",") : [];

  return (
    <View style={gs.safeArea}>
      <View style={[gs.containerRow, { padding: 16, backgroundColor: plate.backgroundSecond, borderBottomWidth: 1, borderBottomColor: plate.gray }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={plate.text} />
        </TouchableOpacity>
        <Text style={[gs.h3, { marginLeft: 12, flex: 1 }]}>{name}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {images.length > 0 ? (
          <View style={{ height: 280 }}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setImgPage(Math.round(e.nativeEvent.contentOffset.x / width))}
            >
              {images.map((img: string, i: number) => (
                <Image
                  key={i}
                  source={{ uri: buildImageUrl(img) }}
                  style={{ width, height: 280 }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View style={{ position: "absolute", bottom: 12, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 6 }}>
                {images.map((_: string, i: number) => (
                  <View
                    key={i}
                    style={{
                      width: i === imgPage ? 20 : 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: i === imgPage ? plate.primary : "rgba(255,255,255,0.6)",
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={{ width: "100%", height: 200, backgroundColor: plate.gray, justifyContent: "center", alignItems: "center" }}>
            <Ionicons name="image-outline" size={48} color={plate.graySecond} />
          </View>
        )}

        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <Text style={[gs.h2, { marginBottom: 8 }]}>{name}</Text>

          <View style={{ flexDirection: "row", gap: 16, marginBottom: 12 }}>
            <View style={[gs.badge, { backgroundColor: plate.primary + "20" }]}>
              <Text style={[gs.badgeText, { color: plate.primary, fontSize: 14 }]}>
                {product.price?.toLocaleString()} {product.currency === "syp" ? "SYP" : "$"}
              </Text>
            </View>
            <View style={[gs.badge, { backgroundColor: plate.blue + "20" }]}>
              <Text style={[gs.badgeText, { color: plate.blue }]}>
                {t("product.stockLabel", { stock: product.stock ?? 0 })}
              </Text>
            </View>
          </View>

          {desc ? (
            <Text style={[gs.text, { marginBottom: 12, lineHeight: 22 }]}>{desc}</Text>
          ) : null}

          {colors.length > 0 ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={[gs.caption, { marginBottom: 6 }]}>{t("productForm.colors")}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {colors.map((hex: string, i: number) => (
                  <View
                    key={i}
                    style={{
                      width: 32, height: 32, borderRadius: 16,
                      backgroundColor: /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : plate.gray,
                      borderWidth: 1, borderColor: plate.graySecond,
                    }}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {product.notesEn?.filter((n: string) => !n.startsWith("colors:")).length > 0 || product.notesAr?.filter((n: string) => !n.startsWith("colors:")).length > 0 ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={[gs.caption, { marginBottom: 4 }]}>{t("productForm.notes")}</Text>
              <Text style={gs.text}>
                {(isAr ? product.notesAr : product.notesEn)?.filter((n: string) => !n.startsWith("colors:")).join(", ") ?? ""}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
