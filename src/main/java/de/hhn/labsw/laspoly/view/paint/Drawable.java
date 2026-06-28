package de.hhn.labsw.laspoly.view.paint;
import javafx.scene.Node;

/**
 * Interface which marks a class as 3D drawable.
 * A drawable class can draw itself in the draw method.
 */
public interface Drawable  {
    /**
     * Implement drawing the model class in this method.
     * Do not handle rotation or translation relative to the game board inside
     * this method; its handled by GameScene.<br>
     * Call this method to repaint the Drawable. Call after the object has been invalidated.
     * @return everything that is returned by this method will be drawn on the GameScene.
     */
    public Node draw();

}
