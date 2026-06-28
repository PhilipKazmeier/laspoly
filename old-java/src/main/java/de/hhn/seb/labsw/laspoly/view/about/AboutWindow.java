/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.fxml.FXMLLoader
 *  javafx.scene.Parent
 *  javafx.scene.Scene
 *  javafx.scene.image.Image
 *  javafx.scene.layout.AnchorPane
 *  javafx.stage.Stage
 */
package de.hhn.seb.labsw.laspoly.view.about;

import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import de.hhn.seb.labsw.laspoly.view.about.AboutWindowController;
import java.io.IOException;
import java.util.Locale;
import java.util.logging.Logger;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.image.Image;
import javafx.scene.layout.AnchorPane;
import javafx.stage.Stage;

public final class AboutWindow
extends Stage {
    private static AboutWindow instance;
    private static Locale locale;
    private final Logger logger;
    private static AboutWindowController controller;

    private AboutWindow(Locale loc) {
        locale = loc;
        FXMLLoader loader = FXMLFile.ABOUT.toFXMLLoader((this).getClass());
        this.logger = LoggerFactory.initializeLogger((this).getClass(), "de/hhn/seb/labsw/laspoly/view/view_logging.properties");
        try {
            AnchorPane pane = (AnchorPane)loader.load();
            this.setScene(new Scene((Parent)pane));
            controller = (AboutWindowController)loader.getController();
            controller.setAboutWindow(this);
        }
        catch (IOException e) {
            this.logger.severe("Could't create a new about window.");
            e.printStackTrace();
        }
        this.setResizable(false);
        this.setOnCloseRequest(event -> {
            event.consume();
            instance.hide();
        });
        this.getIcons().add(new Image((this).getClass().getResourceAsStream("/de/hhn/seb/labsw/laspoly/view/LasPolyIcon_64x64.png")));
    }

    public static synchronized void show(Locale loc) {
        if (instance == null) {
            instance = new AboutWindow(loc);
        }
        if (!locale.equals(loc)) {
            locale = loc;
            controller.refreshLocale();
        }
        instance.show();
    }

    protected Locale getLocale() {
        return locale;
    }

    public void setNewTitle(String title) {
        this.setTitle(title);
    }
}

