/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.utils;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonParseException;
import de.hhn.seb.labsw.laspoly.exception.InvalidParameterException;
import de.hhn.seb.labsw.laspoly.model.settings.GeneralSettings;
import de.hhn.seb.labsw.laspoly.model.settings.KeySettings;
import de.hhn.seb.labsw.laspoly.model.settings.Settings;
import de.hhn.seb.labsw.laspoly.model.settings.SoundSettings;
import de.hhn.seb.labsw.laspoly.utils.DateTimeConverter;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.logging.Logger;
import org.apache.commons.io.FileUtils;
import org.joda.time.DateTime;

public final class StorageUtils {
    private static final String STORAGE_PATH = System.getProperty("user.home") + "/.laspoly";
    private static final String SETTINGS_SUB_PATH = "/settings";
    private static final String VERSION_FILE_PATH = STORAGE_PATH + "/version";
    private static final Gson GSON = new GsonBuilder().registerTypeAdapter((Type)(DateTime.class), new DateTimeConverter()).create();
    private static Logger logger;

    private StorageUtils() {
        logger = LoggerFactory.initializeLogger(this.getClass(), "de/hhn/seb/labsw/laspoly/utils/utils_logging.properties");
    }

    private static void createFolders() {
        File storageDir = new File(STORAGE_PATH);
        if (!storageDir.exists()) {
            storageDir.mkdir();
        }
        File settingsDir = new File(STORAGE_PATH + SETTINGS_SUB_PATH);
        if (!settingsDir.exists()) {
            settingsDir.mkdir();
        }
    }

    public static void deleteSettings() {
        File dir = new File(STORAGE_PATH + SETTINGS_SUB_PATH);
        try {
            if (dir.exists()) {
                FileUtils.deleteDirectory(dir);
            }
        }
        catch (IOException e) {
            logger.severe("Couldn't delete the settings");
            e.printStackTrace();
        }
    }

    public static void saveSetting(Settings settings, Settings.Category category) {
        StorageUtils.createFolders();
        File file = new File(STORAGE_PATH + SETTINGS_SUB_PATH + "/" + category.getName() + ".settings");
        try {
            Files.writeString(file.toPath(), GSON.toJson(settings), StandardCharsets.UTF_8);
        }
        catch (IOException e) {
            logger.severe("Couldn't save the settings");
            e.printStackTrace();
        }
    }

    public static Settings loadSettings(Settings.Category category) {
        StorageUtils.createFolders();
        File file = new File(STORAGE_PATH + SETTINGS_SUB_PATH + "/" + category.getName() + ".settings");
        switch (category) {
            case GENERAL: {
                if (file.exists()) {
                    try {
                        return GSON.fromJson(StorageUtils.readJsonFile(file), GeneralSettings.class);
                    }
                    catch (JsonParseException | IOException parse) {
                        logger.severe("Couldn't load the settings");
                        parse.printStackTrace();
                        file.delete();
                        return new GeneralSettings();
                    }
                }
                return new GeneralSettings();
            }
            case KEYS: {
                if (file.exists()) {
                    try {
                        return GSON.fromJson(StorageUtils.readJsonFile(file), KeySettings.class);
                    }
                    catch (JsonParseException | IOException parse) {
                        logger.severe("Couldn't load the key mapping");
                        parse.printStackTrace();
                        file.delete();
                        return new KeySettings();
                    }
                }
                return new KeySettings();
            }
            case SOUND: {
                if (file.exists()) {
                    try {
                        return GSON.fromJson(StorageUtils.readJsonFile(file), SoundSettings.class);
                    }
                    catch (JsonParseException | IOException parse) {
                        logger.severe("Couldn't load the sound settings");
                        parse.printStackTrace();
                        file.delete();
                        return new SoundSettings();
                    }
                }
                return new SoundSettings();
            }
        }
        throw new InvalidParameterException("The given category has to implemented", "category", category);
    }

    private static String readJsonFile(File file) throws IOException {
        byte[] bytes = Files.readAllBytes(file.toPath());
        if (bytes.length > 0 && bytes[0] == '{') {
            return new String(bytes, StandardCharsets.UTF_8);
        }
        try (ObjectInputStream objIn = new ObjectInputStream(new ByteArrayInputStream(bytes))) {
            return objIn.readUTF();
        }
    }

    public static double readStoredVersion() {
        StorageUtils.createFolders();
        File file = new File(VERSION_FILE_PATH);
        if (!file.exists()) {
            return Double.NaN;
        }
        try {
            byte[] bytes = Files.readAllBytes(file.toPath());
            if (bytes.length >= 2 && bytes[0] == -84 && bytes[1] == -19) {
                try (ObjectInputStream objIn = new ObjectInputStream(new ByteArrayInputStream(bytes))) {
                    return objIn.readDouble();
                }
            }
            return Double.parseDouble(new String(bytes, StandardCharsets.UTF_8).trim());
        }
        catch (IOException | NumberFormatException e) {
            logger.severe("Couldn't read the version number");
            e.printStackTrace();
            file.delete();
            return -1.0;
        }
    }

    public static void writeStoredVersion(double version) {
        StorageUtils.createFolders();
        try {
            Files.writeString(new File(VERSION_FILE_PATH).toPath(), Double.toString(version), StandardCharsets.UTF_8);
        }
        catch (IOException e) {
            logger.severe("Couldn't write the version number");
            e.printStackTrace();
        }
    }
}
