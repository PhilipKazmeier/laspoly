/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.event.ActionEvent
 *  javafx.fxml.FXML
 *  javafx.fxml.Initializable
 *  javafx.scene.Cursor
 *  javafx.scene.Node
 *  javafx.scene.control.Button
 *  javafx.scene.control.Tab
 *  javafx.scene.control.Tooltip
 *  javafx.scene.image.ImageView
 *  javafx.scene.web.WebView
 */
package de.hhn.seb.labsw.laspoly.view.about;

import de.hhn.seb.labsw.laspoly.main.Main;
import de.hhn.seb.labsw.laspoly.utils.ThreadRunner;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import de.hhn.seb.labsw.laspoly.utils.dataloading.ResourceBundleSource;
import de.hhn.seb.labsw.laspoly.view.about.AboutWindow;
import java.net.URL;
import java.util.ResourceBundle;
import javafx.event.ActionEvent;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.Cursor;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.Tab;
import javafx.scene.control.Tooltip;
import javafx.scene.image.ImageView;
import javafx.scene.web.WebView;

public class AboutWindowController
implements Initializable {
    @FXML
    private Button closeButton;
    @FXML
    private WebView generalView;
    @FXML
    private WebView copyrightView;
    @FXML
    private WebView ruleView;
    @FXML
    private Tab tabRules;
    @FXML
    private Tab tabGeneral;
    @FXML
    private Tab tabCopyRight;
    private AboutWindow window;

    public void initialize(URL location, ResourceBundle resources) {
        ImageView closeView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CROSS));
        closeView.setFitHeight(25.0);
        closeView.setFitWidth(25.0);
        this.closeButton.setGraphic((Node)closeView);
    }

    public final void setAboutWindow(AboutWindow aboutWindow) {
        this.window = aboutWindow;
        this.closeButton.setCursor(Cursor.HAND);
        this.refreshLocale();
    }

    public final void close(ActionEvent actionEvent) {
        this.window.close();
    }

    public void refreshLocale() {
        ResourceBundle bundle = DataLoader.getInstance().getResourceBundle(ResourceBundleSource.ABOUT, this.window.getLocale());
        String urlTitle = bundle.getString("title");
        this.window.setNewTitle(urlTitle);
        String urlGeneralTabTitle = bundle.getString("generalTab");
        this.tabGeneral.setText(urlGeneralTabTitle);
        String urlRulesTabTitle = bundle.getString("rulesTab");
        this.tabRules.setText(urlRulesTabTitle);
        String urlCopyrightTabTitle = bundle.getString("copyrightTab");
        this.tabCopyRight.setText(urlCopyrightTabTitle);
        String urlGeneral = this.getClass().getResource(bundle.getString("general")).toExternalForm();
        this.generalView.getEngine().load(urlGeneral);
        this.generalView.getEngine().locationProperty().addListener((observable, oldValue, newValue) -> {
            if (!newValue.contains("file:///")) {
                Main.getApplication().getHostServices().showDocument(newValue);
            }
            ThreadRunner.onFX(() -> this.generalView.getEngine().load(urlGeneral), 0L);
        });
        String urlRules = this.getClass().getResource(bundle.getString("rules")).toExternalForm();
        this.ruleView.getEngine().load(urlRules);
        this.ruleView.getEngine().locationProperty().addListener((observable, oldValue, newValue) -> {
            if (!newValue.contains("file:///")) {
                Main.getApplication().getHostServices().showDocument(newValue);
            }
            ThreadRunner.onFX(() -> this.ruleView.getEngine().load(urlRules), 0L);
        });
        String urlCopyright = this.getClass().getResource(bundle.getString("copyright")).toExternalForm();
        this.copyrightView.getEngine().load(urlCopyright);
        this.copyrightView.getEngine().locationProperty().addListener((observable, oldValue, newValue) -> {
            if (!newValue.contains("file:///")) {
                Main.getApplication().getHostServices().showDocument(newValue);
            }
            ThreadRunner.onFX(() -> this.copyrightView.getEngine().load(urlCopyright), 0L);
        });
        this.closeButton.setText(bundle.getString("close"));
        this.closeButton.setTooltip(new Tooltip(bundle.getString("tooltipClose")));
    }

    public void refreshLocation(double x, double y) {
        this.window.setX(x);
        this.window.setY(y);
    }
}

