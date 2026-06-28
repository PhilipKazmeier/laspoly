package de.hhn.labsw.laspoly;

import javafx.application.Application;
import javafx.stage.Stage;
import org.junit.BeforeClass;

/**
 * Extend a test class from this class
 */
public class GraphicsTest extends Application {
    @BeforeClass
    public static void initializeGraphics() {
        new Thread(() -> {
            try {
                launch();
            } catch (IllegalStateException ignored) {
            }
        }).start();
    }

    @Override
    public void start(Stage primaryStage) throws Exception {
    }

}
