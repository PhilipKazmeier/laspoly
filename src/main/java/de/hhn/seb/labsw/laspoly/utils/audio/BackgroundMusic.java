/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.media.Media
 *  javafx.scene.media.MediaPlayer
 *  javafx.scene.media.MediaPlayer$Status
 */
package de.hhn.seb.labsw.laspoly.utils.audio;

import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.dataloading.MusicSource;
import de.hhn.seb.labsw.laspoly.utils.dataloading.ShortSource;
import java.io.File;
import java.io.UnsupportedEncodingException;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLDecoder;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import javafx.scene.media.Media;
import javafx.scene.media.MediaException;
import javafx.scene.media.MediaPlayer;
import org.apache.commons.io.FilenameUtils;

public final class BackgroundMusic {
    private static Map<String, URL> music = new HashMap<String, URL>();
    private static Map<String, URL> shortplay = new HashMap<String, URL>();
    private static MediaPlayer player;
    private static double volume;
    private static boolean mute;
    private static String gameMusic;
    private static String lobbyMusic;
    private static MediaPlayer paused;
    private static String current;
    private static Logger logger;

    private BackgroundMusic() {
    }

    public static void initializeMusic() {
        for (MusicSource musi : MusicSource.values()) {
            BackgroundMusic.addMusic(BackgroundMusic.class.getResource(musi.source()));
        }
    }

    public static void initializeShort() {
        for (ShortSource shortPlay : ShortSource.values()) {
            BackgroundMusic.addShortPlay(BackgroundMusic.class.getResource(shortPlay.source()));
        }
    }

    public static void addShortPlay(URL url) {
        String title = FilenameUtils.getBaseName(BackgroundMusic.reFormatPath(url.toString()));
        shortplay.put(title, url);
    }

    public static void addMusic(URL url) {
        String title = FilenameUtils.getBaseName(BackgroundMusic.reFormatPath(url.toString()));
        music.put(title, url);
    }

    public static void addExternalMusic(File file) {
        String title = FilenameUtils.getBaseName(BackgroundMusic.reFormatPath(file.toString()));
        URL f = null;
        try {
            f = file.toURI().toURL();
        }
        catch (MalformedURLException e) {
            logger.log(Level.SEVERE, "The URL to the file isn't valid.\nFile: {0}.\nMessage: {1}", new Object[]{file.getPath(), e.getMessage()});
        }
        if (f != null) {
            music.put(title, f);
        }
    }

    public static void play(String musicName) {
        try {
            if (!music.containsKey(musicName)) {
                logger.warning("Unknown music track: " + musicName);
                return;
            }
            if (player == null) {
                BackgroundMusic.setUpForPlay(musicName);
            } else if (!musicName.equals(current)) {
                BackgroundMusic.setUpForPlay(musicName);
            } else {
                BackgroundMusic.checkMute();
                player.play();
            }
        } catch (MediaException | IllegalStateException e) {
            logger.log(Level.WARNING, "Background music unavailable (continuing without audio): {0}", e.getMessage());
        }
    }

    private static void setLoop(String musicName) {
        player.setOnEndOfMedia(() -> {
            Media media = new Media(music.get(musicName).toString());
            player = new MediaPlayer(media);
            player.setVolume(volume);
            BackgroundMusic.checkMute();
            BackgroundMusic.setLoop(musicName);
            player.play();
        });
    }

    public static void pause() {
        player.pause();
    }

    public static void shortPlay(String name) {
        paused = player;
        Media media = new Media(shortplay.get(name).toString());
        player = new MediaPlayer(media);
        player.setVolume(volume);
        BackgroundMusic.checkMute();
        player.setOnEndOfMedia(() -> {
            player = paused;
            player.setVolume(volume);
            BackgroundMusic.checkMute();
            player.play();
        });
        paused.pause();
        player.play();
    }

    public static void stopLoop() {
        player.setOnEndOfMedia(() -> ((MediaPlayer)player).stop());
        player.stop();
    }

    public static void mute() {
        mute = true;
        if (player != null) {
            player.setMute(true);
        }
    }

    public static void unMute() {
        mute = false;
        if (player != null) {
            player.setMute(false);
        }
    }

    public static void setVolume(Double vol) {
        volume = vol >= 1.0 ? 1.0 : (vol <= 0.0 ? 0.0 : vol);
        if (player != null && (player.getStatus().equals(MediaPlayer.Status.PLAYING) || player.getStatus().equals(MediaPlayer.Status.UNKNOWN))) {
            player.setVolume(volume);
        }
    }

    public static String getGameMusic() {
        return gameMusic;
    }

    public static void setGameMusic(String gMusic) {
        gameMusic = gMusic;
    }

    public static String getLobbyMusic() {
        return lobbyMusic;
    }

    public static void setLobbyMusic(String lMusic) {
        lobbyMusic = lMusic;
    }

    private static void checkMute() {
        if (mute) {
            player.setMute(true);
        } else {
            player.setMute(false);
        }
    }

    private static void setUpForPlay(String musicName) {
        try {
            if (player != null) {
                player.stop();
                player.dispose();
            }
            Media media = new Media(music.get(musicName).toString());
            current = musicName;
            player = new MediaPlayer(media);
            player.setVolume(volume);
            BackgroundMusic.checkMute();
            BackgroundMusic.setLoop(musicName);
            player.play();
        } catch (RuntimeException e) {
            player = null;
            logger.log(Level.WARNING, "Background music unavailable: {0}", e.getMessage());
        }
    }

    private static String reFormatPath(String path) {
        String newPath = path;
        try {
            newPath = URLDecoder.decode(path, "UTF-8");
        }
        catch (UnsupportedEncodingException e) {
            logger.log(Level.SEVERE, "Couldn't encode path: " + path);
        }
        return newPath;
    }

    static {
        volume = 1.0;
        logger = LoggerFactory.initializeLogger(BackgroundMusic.class, LoggerFactory.LOG_FOLDER);
    }
}

