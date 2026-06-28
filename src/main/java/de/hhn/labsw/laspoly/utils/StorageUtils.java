package de.hhn.labsw.laspoly.utils;

import de.hhn.labsw.laspoly.model.User;
import de.hhn.labsw.laspoly.network.server.Server;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.util.ArrayList;
import java.util.List;

/**
 * Utility class with methods to write, get, locate and check user data. Later on it can also be used for saved games.
 */
public class StorageUtils {

    /**
     * Path where the data of the user is stored.
     */
    public static final String USER_STORAGE_PATH = "/LasPoly/User";

    /**
     * Path where the data of the server is stored.
     */
    public static final String SERVER_STORAGE_PATH = "/LasPoly/Server";

    /**
     * Name of the file the user data is stored in.
     */
    public static final String USER_FILE_NAME = "users.bin";

    /**
     * Name of the file the server data is stored in.
     */
    public static final String SERVER_FILE_NAME = "server.bin";

    /**
     * Method to check if user data already exists on the computer.
     *
     * @return Returns true if file exists.
     */
    public static boolean isUserDataAlreadyOnDisk() {
        File dir = getUserStorageDirectory();
        File[] allFiles = dir.listFiles(file -> file.isFile() && file.getName().equals(USER_FILE_NAME));
        return allFiles != null && allFiles.length > 0; // TODO verbessern -> nach Namen überprüfen
    }

    /**
     * Method to check if server data already exists on the computer.
     *
     * @return Returns true if file exists.
     */
    public static boolean isServerDataAlreadyOnDisk() {
        File dir = getServerStorageDirectory();
        File[] allFiles = dir.listFiles(file -> file.isFile() && file.getName().equals(SERVER_FILE_NAME));
        return allFiles != null && allFiles.length > 0; // TODO verbessern -> nach Namen überprüfen
    }

    /**
     * Method to check which operating system is in use to determine where the user data should be stored. Creates the
     * folders if they don't exist.
     *
     * @return The valid storage path.
     */
    public static File getUserStorageDirectory() {
        File storageDir = new File(System.getProperty("user.home") + USER_STORAGE_PATH);

        if (System.getProperty("os.name").toUpperCase().contains("WIN")) {
            storageDir = new File(System.getenv("AppData") + USER_STORAGE_PATH);
        }
        if (!storageDir.exists()) {
            storageDir.mkdirs();
        }
        return storageDir;
    }

    /**
     * Method to check which operating system is in use to determine where the server data should be stored. Creates the
     * folders if they don't exist.
     *
     * @return The valid storage path.
     */
    public static File getServerStorageDirectory() {
        File storageDir = new File(System.getProperty("user.home") + SERVER_STORAGE_PATH);

        if (System.getProperty("os.name").toUpperCase().contains("WIN")) {
            storageDir = new File(System.getenv("AppData") + SERVER_STORAGE_PATH);
        }
        if (!storageDir.exists()) {
            storageDir.mkdirs();
        }
        return storageDir;
    }

    /**
     * Method to write the user data to the disk.
     */
    public static void writeUserData(User user) {
        try {
            FileOutputStream fout = new FileOutputStream(getUserStorageDirectory() + File.separator + USER_FILE_NAME);
            ObjectOutputStream oos = new ObjectOutputStream(fout);
            oos.writeObject(user);
            oos.flush();
            fout.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    /**
     * Method to write the server data to the disk.
     */
    public static void writeServerData(Server server) {
        try {
            FileOutputStream fout = new FileOutputStream(getServerStorageDirectory() + File.separator +
                    SERVER_FILE_NAME);
            ObjectOutputStream oos = new ObjectOutputStream(fout);
            oos.writeObject(server.getUsers());
            oos.flush();
            fout.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }


    /**
     * Method to read the user data from the disk.
     *
     * @return The user that was read.
     */
    public static User getUserData() {
        try {
            FileInputStream fin = new FileInputStream(getUserStorageDirectory() + File.separator + USER_FILE_NAME);
            ObjectInputStream ois = new ObjectInputStream(fin);
            return (User) ois.readObject();
        } catch (IOException | ClassNotFoundException e) {
            e.printStackTrace();
            return null;
        }
    }

    /**
     * Method to read the server data from the disk.
     *
     * @return The list of users that was read.
     */
    public static List<User> getServerData() {
        if (isServerDataAlreadyOnDisk()) {
            try {
                FileInputStream fin = new FileInputStream(getServerStorageDirectory() + File.separator +
                        SERVER_FILE_NAME);

                ObjectInputStream ois = new ObjectInputStream(fin);
                return (List<User>) ois.readObject();
            } catch (IOException | ClassNotFoundException e) {
                e.printStackTrace();
            }
        }
        return new ArrayList<>();
    }
}
