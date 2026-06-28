package de.hhn.seb.labsw.laspoly.utils.audio;

import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import java.net.URL;
import java.util.logging.Level;
import java.util.logging.Logger;
import javafx.scene.media.Media;
import javafx.scene.media.MediaPlayer;
import javafx.util.Duration;

public enum Sound {
    PURCHASE("cash-register2.mp3"),
    CONSTRUCTION("250521__celticvalkyria__construction-set.mp3"),
    SHUFFLE("Cards Shuffling-SoundBible.com-565963092.mp3"),
    DRAW("draw.mp3"),
    DRILL("Drill-SoundBible.com-1370234511.mp3"),
    SHAKE("Shake And Roll Dice-SoundBible.com-591494296.mp3"),
    DICEROLLING("dice-rolling.mp3"),
    TRAIN("train-pass-by-01.mp3"),
    TRAIN_WHISTLE("trainwhistle.mp3"),
    LOSE("verloren.mp3"),
    POLICE("police-siren.mp3"),
    SELL("coins-01.mp3"),
    ANNOYINGSIREN("police-siren2.mp3"),
    NOTIFY("notify.mp3"),
    WIN("gewonnen.mp3");

    private static double volume = 1.0;
    private static boolean mute;

    private final Logger logger = LoggerFactory.initializeLogger(
        getClass(), "de/hhn/seb/labsw/laspoly/util.audio/audio_logging.properties");
    private final String fileName;
    private Media media;
    private MediaPlayer player;
    private boolean unavailable;

    Sound(String audioName) {
        this.fileName = audioName;
    }

    public static void muteAll() {
        mute = true;
    }

    public static void unMuteAll() {
        mute = false;
    }

    public static void setVolume(Double vol) {
        volume = vol >= 1.0 ? 1.0 : (vol <= 0.0 ? 0.0 : vol);
    }

    private synchronized void initIfNeeded() {
        if (player != null || unavailable) {
            return;
        }
        try {
            URL file = getClass().getResource("/de/hhn/seb/labsw/laspoly/utils/audio/effect/" + fileName);
            if (file == null) {
                unavailable = true;
                return;
            }
            media = new Media(file.toString());
            player = new MediaPlayer(media);
            player.setOnError(() -> {
                if (media.getError() != null) {
                    logger.severe("Error while playing " + media.getError().getMessage());
                }
            });
            player.setOnHalted(() -> player.dispose());
        } catch (RuntimeException e) {
            unavailable = true;
            logger.log(Level.WARNING, "Sound effect unavailable on this system: {0}", fileName);
        }
    }

    public void customLoop() {
        initIfNeeded();
        if (player == null) {
            return;
        }
        setLoop();
        player.play();
    }

    private void setLoop() {
        player.setOnEndOfMedia(() -> {
            player = new MediaPlayer(media);
            setLoop();
            player.play();
        });
    }

    public void play() {
        initIfNeeded();
        if (player == null) {
            return;
        }
        player.stop();
        player = new MediaPlayer(media);
        player.seek(Duration.millis(0.0));
        player.setVolume(mute ? 0.0 : volume);
        player.play();
    }

    public void stop() {
        initIfNeeded();
        if (player != null && MediaPlayer.Status.PLAYING.equals(player.getStatus())) {
            player.stop();
        }
    }

    public void stopCustomLoop() {
        initIfNeeded();
        if (player == null) {
            return;
        }
        player.setOnEndOfMedia(() -> player.stop());
        player.stop();
    }

    public void loop() {
        initIfNeeded();
        if (player == null) {
            return;
        }
        player.cycleCountProperty().set(-1);
        if (!MediaPlayer.Status.PLAYING.equals(player.getStatus())) {
            player.play();
        }
    }

    public void mute() {
        initIfNeeded();
        if (player != null && !player.isMute()) {
            player.setMute(true);
        }
    }

    public void unMute() {
        initIfNeeded();
        if (player != null && player.isMute()) {
            player.setMute(false);
        }
    }
}
