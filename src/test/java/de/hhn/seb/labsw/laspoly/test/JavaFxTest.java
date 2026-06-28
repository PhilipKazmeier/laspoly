package de.hhn.seb.labsw.laspoly.test;

import javafx.application.Platform;
import org.junit.jupiter.api.BeforeAll;

public abstract class JavaFxTest {
    @BeforeAll
    static void initJavaFx() {
        try {
            Platform.startup(() -> {});
        }
        catch (IllegalStateException alreadyStarted) {
        }
    }
}
