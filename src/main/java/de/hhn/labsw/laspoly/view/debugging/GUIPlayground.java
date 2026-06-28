package de.hhn.labsw.laspoly.view.debugging;
import de.hhn.labsw.laspoly.model.Game;
import de.hhn.labsw.laspoly.model.User;
import de.hhn.labsw.laspoly.network.client.Client;
import de.hhn.labsw.laspoly.view.game.GameWindow;
import de.hhn.labsw.laspoly.view.game.gamescene.GameScene;
import javafx.application.Application;
import javafx.scene.Group;
import javafx.scene.Scene;
import javafx.stage.Stage;

import java.util.Locale;

/**
 * Playground to debug GUI
 */
public class GUIPlayground extends Application {
    /**
     * The panel that renders the game board and all the actions of the game that affect it.
     */
    private GameScene gameScene;
    /**
     * Set this true to only view the game scene.
     */
    private final boolean debugGameScene = false;

    @Override
    public void start(Stage primaryStage) {
        if (debugGameScene) {
            Group root = new Group();
            gameScene = new GameScene();
            root.getChildren().add(gameScene);
            Scene scene = new Scene(root);
            primaryStage.setScene(scene);
            primaryStage.setTitle("LasPoly");
            primaryStage.show();
        } else {
            User user = new User("Brian", Locale.GERMAN, 0);
            Game game = new Game("Patrick", user);
            // TODO game.start(gameWindowController);
            new GameWindow(game, new Client(user)).show();
        }
    }

    /**
     * Main method launches the GUI Playground JavaFX app.
     *
     * @param args the console arguments
     */
    public static void main(String[] args) {
        launch(args);
    }
}
