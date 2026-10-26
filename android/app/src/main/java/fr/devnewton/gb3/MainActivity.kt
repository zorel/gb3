package fr.devnewton.gb3

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import fr.devnewton.gb3.ui.Gb3App
import fr.devnewton.gb3.ui.Gb3ViewModel

class MainActivity : ComponentActivity() {
    private val viewModel: Gb3ViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            Gb3App(viewModel)
        }
    }
}
